import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import {
  DAILY_FREE_LIMIT,
  DAY_PASS_PRICE_KRW,
  claimPaymentOrder,
  getStatus,
  grantDayPass,
  recordUsage,
} from "./src/server/quota";

dotenv.config();

const app = express();
const PORT = 3000;

// CORS — the Capacitor Android WebView runs from https://localhost and needs
// to hit /api/* on the Vercel-hosted server. Browser SPA on the same origin
// is unaffected by these headers.
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(?::\d+)?$/, // local dev + Capacitor Android default
  /^capacitor:\/\/localhost$/,        // Capacitor iOS default
  /^https:\/\/.*\.vercel\.app$/,      // any Vercel preview or prod deployment
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (typeof origin === "string" && ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

// Set up JSON body parsing with large limit to accept photo uploads in base64
app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Gemini API client to prevent crashing on server startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. AI Studio 설정에서 비밀키를 등록해주세요.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----- GET /api/usage : current quota state for an anonymous user -----
app.get("/api/usage", async (req, res) => {
  try {
    const userId = String(req.query.userId ?? "").trim();
    if (!userId) return res.status(400).json({ error: "userId가 필요합니다." });
    const status = await getStatus(userId);
    return res.json(status);
  } catch (err: any) {
    console.error("Usage Error:", err);
    return res.status(500).json({ error: err?.message || "사용량 조회 실패" });
  }
});

// ----- POST /api/payment/confirm : verify a Toss payment, grant day pass -----
app.post("/api/payment/confirm", async (req, res) => {
  try {
    const { userId, paymentKey, orderId, amount } = req.body ?? {};
    if (!userId || !paymentKey || !orderId || !amount) {
      return res.status(400).json({ error: "결제 확인에 필요한 정보가 누락되었습니다." });
    }
    if (Number(amount) !== DAY_PASS_PRICE_KRW) {
      return res.status(400).json({ error: "결제 금액이 일치하지 않습니다." });
    }

    // Idempotency: ignore duplicate confirmations of the same orderId.
    const fresh = await claimPaymentOrder(orderId);
    if (!fresh) {
      const status = await getStatus(userId);
      return res.json({ ok: true, alreadyConfirmed: true, status });
    }

    const secret = process.env.TOSS_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ error: "TOSS_SECRET_KEY가 설정되지 않았습니다." });
    }

    // Toss confirm API: Basic auth with `${secretKey}:` base64 encoded.
    const authHeader = "Basic " + Buffer.from(secret + ":").toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossJson: any = await tossRes.json().catch(() => ({}));
    if (!tossRes.ok) {
      return res.status(402).json({
        error: tossJson?.message || "토스 결제 승인에 실패했습니다.",
        code: tossJson?.code,
      });
    }

    await grantDayPass(userId);
    const status = await getStatus(userId);
    return res.json({ ok: true, status, payment: { orderId, amount } });
  } catch (err: any) {
    console.error("Payment Confirm Error:", err);
    return res.status(500).json({ error: err?.message || "결제 확인 중 오류가 발생했습니다." });
  }
});

// API endpoint to analyze inscriptions (quota-gated)
app.post("/api/analyze", async (req, res) => {
  try {
    const { text, image, imageMime, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId가 필요합니다." });
    }
    if (!text && !image) {
      return res.status(400).json({ error: "분석할 라틴어 문구 텍스트나 촬영된 이미지를 제공해 주세요." });
    }

    // Quota gate: free DAILY_FREE_LIMIT uses per KST day unless a day pass is active.
    const preStatus = await getStatus(userId);
    if (preStatus.blocked) {
      return res.status(402).json({
        error: `오늘의 무료 ${DAILY_FREE_LIMIT}회 한도를 모두 사용하셨습니다. 1일권을 구매하시면 자정까지 무제한 분석할 수 있습니다.`,
        code: "QUOTA_EXCEEDED",
        status: preStatus,
        dayPassPrice: DAY_PASS_PRICE_KRW,
      });
    }

    const ai = getGeminiClient();

    let contentParts: any[] = [];

    if (image) {
      contentParts.push({
        inlineData: {
          mimeType: imageMime || "image/jpeg",
          data: image,
        },
      });
    }

    // Compose prompt according to the official specifications
    const promptText = `
너는 유럽 성지순례자를 위한 최고의 AI 도슨트이자, 고전/교회 라틴어 및 이탈리아어·스페인어 비문 학자이며 신학자이다.
유저가 유럽 성당, 성화, 무덤 등에서 촬영하거나 입력한 문구를 성경적/신학적/언어학적으로 완벽히 분석하여 해설을 제공해야 한다.

성경 구절이나 교회 전승에 포함된 약어나 비문의 마모 흔적이 보인다면 가장 타당한 원문으로 자동 교정하고 복원해라.

★ 중요 지침 ★
- 만약 이미지 파일이 첨부되었고 텍스트가 명시적으로 제공되지 않았거나 빈칸인 경우, 이미지에서 라틴어 혹은 종교적 비문을 즉시 OCR하여 판독해내십시오.
- 판독해 낸 최종 복원/교정형 텍스트를 반드시 "purifiedText" 필드에 정갈하게 담으십시오. 머리말 장식이나 부호 없이 텍스트 자체만 넣으십시오. 이 데이터는 1. 원문 정제와 함께 유저의 '발견구절 입력창' 에 실시간 동기화되어 저장됩니다.

분석 요청:
${text ? `라틴어/종교 문구: "${text}"` : "첨부된 비문 이미지 분석 요청 (이미지 속 비문을 자동 추출하여 해석해 주세요)"}

너의 분석 결과는 유저 화면에 예쁘게 표기하기 위해 반드시 아래 규격의 JSON 형식으로 돌려주어라:
{
  "purifiedText": "약어를 복원하고 오타를 교정한 라틴어(또는 이탈리아어/스페인어 여부) 최종 원문 텍스트 (불필요한 설명 없이 텍스트 본문만)",
  "biblicalReference": "📖 2. 성경 매칭 (Biblical Reference) 데이터 - 정확한 장·절 및 출처",
  "translationLiteral": "✍️ 3. [직역] 단어 본래 의미에 충실한 직역 번역",
  "translationContextual": "✍️ 3. [의역] 한국 가톨릭 성경 이나 개역개정의 톤앤매너를 반영한 자연스러운 의역 번역",
  "linguisticInsight": "💡 4. 문법 및 어원 팁 (Linguistic Insight) 데이터 (대표 단어 1~2개 어원, 격변화, 성경적 고유 의미)",
  "meditation": "🕊️ 5. 순례자를 위한 묵상 가이드 (Pilgrim Meditation) 데이터 (역사적/신학적 깊이를 엮은 3줄 이내 묵상 제안)",
  "rawMarkdown": "위 5가지 항목의 정보를 가미하여 요구한 형식의 정중하고 정교하게 포맷팅된 한국어 Markdown 문자열"
}

반드시 JSON 형식을 지키고, 한국어로 작성하며, 순례자의 영성을 고양할 수 있도록 극진히 예의 바르고 깊이 있는 성서학자의 어조를 사용하라.
`;

    contentParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "purifiedText",
            "biblicalReference",
            "translationLiteral",
            "translationContextual",
            "linguisticInsight",
            "meditation",
            "rawMarkdown"
          ],
          properties: {
            purifiedText: { type: Type.STRING },
            biblicalReference: { type: Type.STRING },
            translationLiteral: { type: Type.STRING },
            translationContextual: { type: Type.STRING },
            linguisticInsight: { type: Type.STRING },
            meditation: { type: Type.STRING },
            rawMarkdown: { type: Type.STRING }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini API에서 응답 데이터를 받지 못했습니다.");
    }

    const parsedResult = JSON.parse(resultText.trim());

    // Record the usage *after* a successful Gemini response so that failed
    // calls don't burn the user's free quota.
    await recordUsage(userId).catch((e) =>
      console.error("recordUsage failed (non-fatal):", e)
    );
    const postStatus = await getStatus(userId).catch(() => null);

    return res.json({ ...parsedResult, _quota: postStatus });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: error.message || "비문 분석 도중 오류가 발생했습니다." });
  }
});

// Export Express app for Vercel serverless (and other re-use)
export default app;

// Local development / production server entry — Vite is dynamically imported so
// that this file can also be consumed as a Vercel serverless function without
// pulling Vite into the cold-start bundle.
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve build artifacts from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pilgrimage Translation Docent server running on port ${PORT}`);
  });
}

// Vercel sets the VERCEL env var on its runtime — skip starting a local server there.
if (!process.env.VERCEL) {
  startServer();
}

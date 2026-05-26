import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

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

// API endpoint to analyze inscriptions
app.post("/api/analyze", async (req, res) => {
  try {
    const { text, image, imageMime } = req.body;

    if (!text && !image) {
      return res.status(400).json({ error: "분석할 라틴어 문구 텍스트나 촬영된 이미지를 제공해 주세요." });
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
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: error.message || "비문 분석 도중 오류가 발생했습니다." });
  }
});

// Setup Vite development server or production assets hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve build artifacts from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pilgrimage Translation Docent server running on port ${PORT}`);
  });
}

startServer();

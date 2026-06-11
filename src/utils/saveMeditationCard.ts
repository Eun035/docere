import { AnalysisResult } from "../types";

interface SaveOptions {
  analysis: AnalysisResult;
  locationName?: string;
}

const WIDTH = 1080;
const HEIGHT = 1920;
const PAD_X = 90;

/**
 * Renders a portrait-oriented PNG meditation card and either invokes the
 * native share sheet (so iOS users can "Save to Photos") or falls back to a
 * direct download.
 */
export async function saveMeditationCard({
  analysis,
  locationName,
}: SaveOptions): Promise<{ method: "share" | "download" }> {
  const blob = await renderMeditationCard(analysis, locationName);
  const filename = makeFilename(analysis.purifiedText);

  const file = new File([blob], filename, { type: "image/png" });
  const shareData: ShareData = { files: [file], title: "Verbum Vitae 묵상" };

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare(shareData) &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(shareData);
      return { method: "share" };
    } catch (err: any) {
      if (err?.name === "AbortError") return { method: "share" };
      // fall through to download
    }
  }

  triggerDownload(blob, filename);
  return { method: "download" };
}

async function renderMeditationCard(
  analysis: AnalysisResult,
  locationName?: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  if ("fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* noop */
    }
  }

  drawBackground(ctx);
  drawBorder(ctx);

  let y = 150;
  y = drawBrand(ctx, y);
  y = drawInscription(ctx, analysis.purifiedText, y);
  y = drawMeta(ctx, locationName, y);
  y = drawDivider(ctx, y);
  y = drawSection(ctx, "📖 성경 매칭", analysis.biblicalReference, y);
  y = drawSection(ctx, "✍️ 직역", analysis.translationLiteral, y);
  y = drawSection(ctx, "✍️ 의역", analysis.translationContextual, y, {
    accent: true,
  });
  y = drawMeditationBanner(ctx, analysis.meditation, y);

  drawFooter(ctx);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob returned null"));
      },
      "image/png",
      0.95
    );
  });
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, "#FDFCF8");
  grad.addColorStop(1, "#F4EFE6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawBorder(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = "#c5a872";
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, WIDTH - 90, HEIGHT - 90);
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, WIDTH - 120, HEIGHT - 120);
  ctx.restore();
}

function drawBrand(ctx: CanvasRenderingContext2D, y: number): number {
  ctx.textAlign = "center";

  ctx.fillStyle = "#8C7355";
  ctx.font = "700 24px Inter, system-ui, sans-serif";
  ctx.fillText("VERBUM VITAE", WIDTH / 2, y);

  ctx.fillStyle = "#A8895A";
  ctx.font = "italic 22px 'Playfair Display', Georgia, serif";
  ctx.fillText("Lumen in Tenebris", WIDTH / 2, y + 38);

  return y + 110;
}

function drawInscription(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number
): number {
  ctx.fillStyle = "#8C7355";
  ctx.font = "700 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  // Letter-spacing isn't universally supported on Canvas2D, so we space manually.
  ctx.fillText("I N S C R I P T I O N", WIDTH / 2, y);
  y += 45;

  ctx.fillStyle = "#3A2814";
  ctx.font = "italic 700 56px 'Playfair Display', Georgia, serif";
  y = wrapText(ctx, text, WIDTH / 2, y, WIDTH - PAD_X * 2, 72, "center");
  return y + 20;
}

function drawMeta(
  ctx: CanvasRenderingContext2D,
  locationName: string | undefined,
  y: number
): number {
  ctx.textAlign = "center";

  if (locationName) {
    ctx.fillStyle = "#8C7355";
    ctx.font = "500 26px Inter, system-ui, sans-serif";
    ctx.fillText(`📍 ${locationName}`, WIDTH / 2, y);
    y += 44;
  }

  const date = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillStyle = "#A8895A";
  ctx.font = "400 22px Inter, system-ui, sans-serif";
  ctx.fillText(date, WIDTH / 2, y);

  return y + 50;
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number): number {
  ctx.strokeStyle = "#c5a872";
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 120, y);
  ctx.lineTo(WIDTH / 2 + 120, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  return y + 60;
}

function drawSection(
  ctx: CanvasRenderingContext2D,
  title: string,
  body: string,
  y: number,
  opts?: { accent?: boolean }
): number {
  ctx.textAlign = "left";

  // Section title
  ctx.fillStyle = "#8C7355";
  ctx.font = "700 22px Inter, system-ui, sans-serif";
  ctx.fillText(title, PAD_X, y);
  y += 38;

  // Underline
  ctx.strokeStyle = "#E6E2D3";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_X, y);
  ctx.lineTo(WIDTH - PAD_X, y);
  ctx.stroke();
  y += 26;

  // Body
  if (opts?.accent) {
    ctx.fillStyle = "#5A4222";
    ctx.font = "italic 700 32px 'Playfair Display', Georgia, serif";
  } else {
    ctx.fillStyle = "#3A2814";
    ctx.font = "400 26px Inter, system-ui, sans-serif";
  }
  y = wrapText(ctx, body, PAD_X, y, WIDTH - PAD_X * 2, 40, "left");
  return y + 40;
}

function drawMeditationBanner(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number
): number {
  const bannerStart = y;
  const bodyMaxWidth = WIDTH - PAD_X * 2 - 60;

  // Measure how tall the wrapped body will be before drawing the background
  ctx.font = "italic 500 30px 'Playfair Display', Georgia, serif";
  const lines = measureWrap(ctx, text, bodyMaxWidth);
  const bodyHeight = lines.length * 44;
  const bannerHeight = 50 + 38 + 24 + bodyHeight + 50;

  // Banner background
  ctx.fillStyle = "#8C7355";
  ctx.fillRect(PAD_X, bannerStart, WIDTH - PAD_X * 2, bannerHeight);

  let cy = bannerStart + 60;
  ctx.textAlign = "left";
  ctx.fillStyle = "#E6E2D3";
  ctx.font = "700 20px Inter, system-ui, sans-serif";
  ctx.fillText("🕊️  순례자를 위한 묵상", PAD_X + 30, cy);
  cy += 50;

  ctx.fillStyle = "#FDFCF8";
  ctx.font = "italic 500 30px 'Playfair Display', Georgia, serif";
  for (const line of lines) {
    ctx.fillText(line, PAD_X + 30, cy);
    cy += 44;
  }

  return bannerStart + bannerHeight + 50;
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#A8895A";
  ctx.font = "400 18px Inter, system-ui, sans-serif";
  ctx.fillText("Verbum Vitae · 라틴어 비문 도슨트", WIDTH / 2, HEIGHT - 100);
  ctx.fillStyle = "#C9B589";
  ctx.font = "italic 16px 'Playfair Display', Georgia, serif";
  ctx.fillText("verbum vitae · in lumine eius videbimus lumen", WIDTH / 2, HEIGHT - 72);
}

function measureWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    if (!paragraph.trim()) continue;
    let line = "";
    for (const ch of paragraph) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: "left" | "center" | "right"
): number {
  ctx.textAlign = align;
  const lines = measureWrap(ctx, text, maxWidth);
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function makeFilename(text: string): string {
  const safe = text
    .normalize("NFC")
    .replace(/[^\w\sㄱ-힣가-힣]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `verbum-vitae_${date}_${safe || "meditation"}.png`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

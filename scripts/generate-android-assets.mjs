// Produces the resources/ images that @capacitor/assets reads to rasterize
// the Android launcher icon + splash screen into android/app/src/main/res.
//
// Inputs:  public/icon.svg  (the master vector — book + candle on dark plate)
// Outputs:
//   resources/icon-only.png        (1024 transparent-padded — Android adaptive foreground)
//   resources/icon-foreground.png  (1024 — adaptive foreground variant)
//   resources/icon-background.png  (1024 — flat dark plate, the candlelit color)
//   resources/splash.png           (2732 — centered logo on the dark plate)
//   resources/splash-dark.png      (same as splash, for dark mode)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "resources");
await mkdir(outDir, { recursive: true });

const svg = await readFile(svgPath);

// ---- Background plate color (mirrors the SVG's bg gradient bottom stop) ----
const PLATE = { r: 0x15, g: 0x11, b: 0x0b, alpha: 1 };

// ---- 1024 icon — used as both icon-only and icon-foreground ----
const icon1024 = await sharp(svg, { density: 384 })
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(path.join(outDir, "icon-only.png"), icon1024);
await writeFile(path.join(outDir, "icon-foreground.png"), icon1024);
console.log("  ✓ resources/icon-only.png + icon-foreground.png (1024×1024)");

// ---- 1024 flat background tile for Android adaptive icons ----
const bg1024 = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: PLATE },
})
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(path.join(outDir, "icon-background.png"), bg1024);
console.log("  ✓ resources/icon-background.png (1024×1024 flat plate)");

// ---- 2732 splash with the logo centered on the dark plate ----
const splashSize = 2732;
const logoSize = 1024;
const logoOnPlate = await sharp(svg, { density: 384 })
  .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const splash = await sharp({
  create: { width: splashSize, height: splashSize, channels: 4, background: PLATE },
})
  .composite([
    {
      input: logoOnPlate,
      top: Math.round((splashSize - logoSize) / 2),
      left: Math.round((splashSize - logoSize) / 2),
    },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(path.join(outDir, "splash.png"), splash);
await writeFile(path.join(outDir, "splash-dark.png"), splash);
console.log("  ✓ resources/splash.png + splash-dark.png (2732×2732 centered logo)");

console.log(
  "\nResources written. Next: `npx capacitor-assets generate --android` to fan out into android/."
);

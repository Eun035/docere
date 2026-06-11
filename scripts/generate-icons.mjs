// Rasterize public/icon.svg into the PNG sizes a PWA + Apple Touch + favicon need.
// Run with: npm run icons
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "public");

const targets = [
  { file: "icon-1024.png", size: 1024 }, // marketing / app store / AI Studio gallery
  { file: "icon-512.png", size: 512 },   // PWA standard + splash
  { file: "icon-192.png", size: 192 },   // PWA home screen
  { file: "apple-touch-icon.png", size: 180 }, // iOS home screen
  { file: "favicon-32.png", size: 32 },  // legacy browser favicon
  { file: "favicon-16.png", size: 16 },  // smallest tab favicon
];

const svg = await readFile(svgPath);

for (const { file, size } of targets) {
  const out = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(outDir, file), out);
  console.log(`  ✓ ${file} (${size}×${size}, ${out.length.toLocaleString()} bytes)`);
}

console.log("\nAll icons generated.");

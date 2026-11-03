/*
 * Regenerates every brand image from the sources in assets/brand/.
 *
 *   npm i -D sharp            # once (image library, dev-only)
 *   node scripts/build-brand-assets.cjs
 *
 * Trims the artwork (ignores stray edge lines), centres it on black and
 * writes public/brand/* and app/icon.png, app/apple-icon.png,
 * app/opengraph-image.png. See assets/brand/README.md.
 */

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const monoSrc = path.join(root, "assets/brand/dc-monogram-source.png");
const fullSrc = path.join(root, "assets/brand/dopamine-club-logo-source.png");
const EDGE_IGNORE = 0.05; // ignore outer 5% (stray white strip / top line)
const BRIGHT = 70; // pixel counts as artwork if any channel > this

async function analyze(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const mx = Math.round(w * EDGE_IGNORE), my = Math.round(h * EDGE_IGNORE);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  const bg = [0, 0, 0]; let bgN = 0;

  for (let y = my; y < h - my; y++) {
    for (let x = mx; x < w - mx; x++) {
      const i = (y * w + x) * c;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (Math.max(r, g, b) > BRIGHT) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      } else if (Math.max(r, g, b) < 30) {
        bg[0] += r; bg[1] += g; bg[2] += b; bgN++;
      }
    }
  }
  const background = { r: Math.round(bg[0] / bgN), g: Math.round(bg[1] / bgN), b: Math.round(bg[2] / bgN) };
  return { box: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }, background, w, h };
}

// Artwork centred on a canvas of (cw x ch); artwork fills `fill` of the limiting side.
async function render(file, a, cw, ch, fill, out, format) {
  const art = await sharp(file).removeAlpha().extract(a.box).toBuffer();
  const scale = Math.min((cw * fill) / a.box.width, (ch * fill) / a.box.height);
  const aw = Math.round(a.box.width * scale), ah = Math.round(a.box.height * scale);
  const resized = await sharp(art).resize(aw, ah, { kernel: "lanczos3" }).toBuffer();

  let img = sharp({ create: { width: cw, height: ch, channels: 3, background: a.background } }).composite([
    { input: resized, left: Math.round((cw - aw) / 2), top: Math.round((ch - ah) / 2) },
  ]);
  img = format === "webp" ? img.webp({ quality: 90 }) : img.png({ compressionLevel: 9, palette: false });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await img.toFile(out);
  const { size } = fs.statSync(out);
  console.log(`${path.relative(root, out).padEnd(44)} ${cw}x${ch}  ${(size / 1024).toFixed(1)} KB`);
}

(async () => {
  const mono = await analyze(monoSrc);
  const full = await analyze(fullSrc);
  console.log("monogram artwork", mono.box, "bg", mono.background);
  console.log("full logo artwork", full.box, "bg", full.background);

  const pub = (p) => path.join(root, "public", "brand", p);
  const app = (p) => path.join(root, "app", p);

  // Served brand assets (public/brand)
  await render(monoSrc, mono, 1024, 1024, 0.64, pub("dc-monogram.png"), "png");
  await render(monoSrc, mono, 256, 256, 0.64, pub("dc-monogram-256.webp"), "webp");
  await render(fullSrc, full, 1024, 1024, 0.78, pub("dopamine-club-logo.png"), "png");
  await render(fullSrc, full, 800, 800, 0.78, pub("dopamine-club-logo-800.webp"), "webp");

  // PWA / manifest icons
  await render(monoSrc, mono, 192, 192, 0.66, pub("dc-monogram-192.png"), "png");
  await render(monoSrc, mono, 512, 512, 0.66, pub("dc-monogram-512.png"), "png");

  // Next.js file-convention icons (app/)
  await render(monoSrc, mono, 512, 512, 0.82, app("icon.png"), "png"); // favicon: tight, readable at 16px
  await render(monoSrc, mono, 180, 180, 0.66, app("apple-icon.png"), "png"); // iOS home screen
  await render(fullSrc, full, 1200, 630, 0.72, app("opengraph-image.png"), "png"); // share preview
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

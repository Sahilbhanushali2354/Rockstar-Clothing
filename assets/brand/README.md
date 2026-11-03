# DOPAMINE CLUB brand assets

## Sources (not served to visitors)

| File | What |
|---|---|
| `dc-monogram-source.png` | "DC" monogram on black, original export |
| `dopamine-club-logo-source.png` | Full logo (DC + DOPAMINE CLUB) on black, original export |

Replace these with higher-resolution or SVG versions when available.

## Generated files (used by the site)

Generated from the sources: artwork trimmed (stray edge lines removed),
centred on black and resized.

| File | Size | Used for |
|---|---|---|
| `public/brand/dc-monogram-256.webp` | 256² | Logo mark in navbar, admin, loader (`<BrandMark>` / `<BrandLogo>`) |
| `public/brand/dopamine-club-logo-800.webp` | 800² | Footer, login/signup brand panel |
| `public/brand/dc-monogram-192.png`, `-512.png` | 192², 512² | Web app manifest (Add to Home Screen), Google logo |
| `public/brand/dc-monogram.png`, `dopamine-club-logo.png` | 1024² | High-res copies for social profiles / print |
| `app/icon.png` | 512² | Browser tab favicon (tight crop) |
| `app/apple-icon.png` | 180² | iOS home screen icon |
| `app/opengraph-image.png` | 1200×630 | Default link preview (WhatsApp, Instagram, etc.) |

To regenerate after replacing a source file:

```
npm i -D sharp
node scripts/build-brand-assets.cjs
```

/*
 * Public site URL for metadata, sitemap and share links.
 * Set NEXT_PUBLIC_SITE_URL once the custom domain is live
 * (e.g. https://dopamineclub.in). Falls back to the Vercel URL, then localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

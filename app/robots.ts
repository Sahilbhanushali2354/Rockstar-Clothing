import type { MetadataRoute } from "next";

import { SITE_URL } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / per-user pages have no search value.
      disallow: ["/admin", "/api/", "/auth/", "/cart", "/wishlist", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { MetadataRoute } from "next";

import { getActiveProductsServer, getCategoriesServer } from "./lib/catalog.server";
import { SITE_URL } from "./lib/site";

// Rebuilt at most hourly; products/categories come from Firestore.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getActiveProductsServer(), getCategoriesServer()]);
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...(categories ?? []).map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(products ?? []).map((product) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

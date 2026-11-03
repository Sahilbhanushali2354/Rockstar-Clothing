import "server-only";

import { getDocument, queryCollection, TAGS, FirestoreReadError } from "./firestoreRest";
import { normalizeProduct, toSlug, type Product } from "./productModel";
import { normalizeSettings, SETTINGS_PATH, type StoreSettings } from "./storeSettings";
import type { StoreCategory } from "./productModel";

/*
 * Server-side catalog reads (cached, purged by /api/revalidate).
 * Each returns `null` on a transient Firestore error so pages can fall
 * back to client-side fetching instead of failing the render.
 */

const newestFirst = (a: Product, b: Product) => b.createdAt - a.createdAt;

async function safe<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof FirestoreReadError) {
      console.error("[catalog]", error.message);
      return null;
    }
    console.error("[catalog]", error);
    return null;
  }
}

/** undefined = transient error (let the client retry); null = not found / hidden */
export async function getProductServer(id: string): Promise<Product | null | undefined> {
  try {
    const doc = await getDocument(`products/${encodeURIComponent(id)}`, [TAGS.products, TAGS.product(id)]);
    if (!doc) return null;
    const product = normalizeProduct(doc.id, doc.data);
    return product.active ? product : null;
  } catch (error) {
    console.error("[catalog] product", id, error);
    return undefined;
  }
}

export function getActiveProductsServer(categorySlug?: string) {
  return safe(async () => {
    const filters: { field: string; value: string | boolean }[] = [{ field: "active", value: true }];
    if (categorySlug) filters.push({ field: "category", value: toSlug(categorySlug) });

    const docs = await queryCollection("products", filters, [TAGS.products]);
    return docs.map((doc) => normalizeProduct(doc.id, doc.data)).sort(newestFirst);
  });
}

export function getCategoriesServer() {
  return safe(async () => {
    const docs = await queryCollection("categories", [], [TAGS.categories]);
    return docs
      .filter((doc) => doc.data.active !== false)
      .map(
        (doc): StoreCategory => ({
          id: doc.id,
          name: String(doc.data.name ?? doc.id),
          slug: toSlug(String(doc.data.slug ?? doc.id)),
          subtitle: String(doc.data.subtitle ?? ""),
          imageUrl: String(doc.data.imageUrl ?? ""),
          imagePath: String(doc.data.imagePath ?? ""),
          order: Number(doc.data.order ?? 0),
        }),
      )
      .sort((a, b) => a.order - b.order);
  });
}

export async function getSettingsServer(): Promise<StoreSettings> {
  const doc = await safe(() => getDocument(`${SETTINGS_PATH.collection}/${SETTINGS_PATH.doc}`, [TAGS.settings]));
  return normalizeSettings(doc?.data);
}

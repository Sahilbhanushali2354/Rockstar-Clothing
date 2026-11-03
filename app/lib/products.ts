/*
 * Browser-side product reads (Firebase client SDK).
 * The model/helpers live in productModel.ts and are re-exported here so
 * existing imports from "@/app/lib/products" keep working.
 *
 * Storefront queries always filter `active == true` (required by the
 * security rules — see firestore.rules).
 */

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { FStore } from "@/firebase/firebase.config";
import { PRODUCTS, normalizeProduct, toSlug, type Product } from "./productModel";

export * from "./productModel";

const newestFirst = (a: Product, b: Product) => b.createdAt - a.createdAt;

/* ---------------- Storefront reads (active only) ---------------- */

export async function getProduct(id: string) {
  const snapshot = await getDoc(doc(FStore, PRODUCTS, id));
  if (!snapshot.exists()) return null;

  const product = normalizeProduct(snapshot.id, snapshot.data());
  return product.active ? product : null;
}

export async function getActiveProducts(categorySlug?: string) {
  const constraints = [where("active", "==", true)];

  if (categorySlug) {
    constraints.push(where("category", "==", toSlug(categorySlug)));
  }

  const snapshot = await getDocs(
    query(collection(FStore, PRODUCTS), ...constraints),
  );

  // Sorted client-side so no composite index is needed.
  return snapshot.docs
    .map((productDoc) => normalizeProduct(productDoc.id, productDoc.data()))
    .sort(newestFirst);
}

/* ---------------- Admin reads (includes hidden) ---------------- */

export async function getProductForAdmin(id: string) {
  const snapshot = await getDoc(doc(FStore, PRODUCTS, id));
  return snapshot.exists()
    ? normalizeProduct(snapshot.id, snapshot.data())
    : null;
}

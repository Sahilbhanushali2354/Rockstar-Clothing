/*
 * Browser-side product reads (Firebase client SDK) — all LIVE listeners,
 * so admin edits in one tab show up in every other open tab instantly.
 * The model/helpers live in productModel.ts and are re-exported here so
 * existing imports from "@/app/lib/products" keep working.
 *
 * Storefront queries always filter `active == true` (required by the
 * security rules — see firestore.rules).
 *
 * Every subscribe* function returns an unsubscribe function; call it from
 * a useEffect cleanup.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";

import { FStore } from "@/firebase/firebase.config";
import { PRODUCTS, normalizeProduct, toSlug, type Product } from "./productModel";

export * from "./productModel";

const newestFirst = (a: Product, b: Product) => b.createdAt - a.createdAt;

type OnError = (error: FirestoreError) => void;

/* ---------------- Storefront (active only) ---------------- */

/**
 * Live product for the storefront. Emits `null` when the product is
 * deleted or hidden. (Hidden products are unreadable for shoppers under
 * the security rules, so the listener reports a permission error — that
 * is passed to `onData(null)` too.)
 */
export function subscribeProduct(
  id: string,
  onData: (product: Product | null) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    doc(FStore, PRODUCTS, id),
    (snapshot) => {
      if (!snapshot.exists()) return onData(null);
      const product = normalizeProduct(snapshot.id, snapshot.data());
      onData(product.active ? product : null);
    },
    (error) => {
      if (error.code === "permission-denied") onData(null);
      else onError?.(error);
    },
  );
}

/** Live list of active products, optionally for one category, newest first. */
export function subscribeActiveProducts(
  categorySlug: string | undefined,
  onData: (products: Product[]) => void,
  onError?: OnError,
): Unsubscribe {
  const constraints = [where("active", "==", true)];
  if (categorySlug) constraints.push(where("category", "==", toSlug(categorySlug)));

  return onSnapshot(
    query(collection(FStore, PRODUCTS), ...constraints),
    (snapshot) =>
      // Sorted client-side so no composite index is needed.
      onData(
        snapshot.docs
          .map((productDoc) => normalizeProduct(productDoc.id, productDoc.data()))
          .sort(newestFirst),
      ),
    (error) => onError?.(error),
  );
}

/* ---------------- Admin (includes hidden) ---------------- */

/** Live product for the admin editor (hidden products included). */
export function subscribeProductForAdmin(
  id: string,
  onData: (product: Product | null) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    doc(FStore, PRODUCTS, id),
    (snapshot) => onData(snapshot.exists() ? normalizeProduct(snapshot.id, snapshot.data()) : null),
    (error) => onError?.(error),
  );
}

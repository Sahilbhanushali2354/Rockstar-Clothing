"use client";

import { auth } from "@/firebase/firebase.config";

/** POST to an admin-only API route with the signed-in user's ID token. */
export async function adminFetch<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in as an admin.");

  const token = await user.getIdToken();

  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

/*
 * Ask the server to refresh cached storefront pages after an admin edit.
 * Best-effort: if it fails, pages still refresh on their own within 60s.
 */
export async function revalidateStore(scope: {
  products?: boolean;
  productIds?: string[];
  categories?: boolean;
  settings?: boolean;
}) {
  try {
    await adminFetch("/api/revalidate", scope);
  } catch (error) {
    console.warn("Storefront refresh failed (pages update within 60s):", error);
  }
}

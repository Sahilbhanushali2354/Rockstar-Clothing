/*
 * Thin, safe wrapper around the Meta Pixel `fbq` global.
 * Calls are no-ops when the pixel isn't loaded (no ID set, ad blockers, SSR).
 */

type Fbq = (
  command: "track" | "trackCustom" | "init",
  event: string,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export type PixelEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "Lead"
  | "Contact"
  | "InitiateCheckout";

export function trackPixel(event: PixelEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  try {
    window.fbq("track", event, params);
  } catch {
    // never let tracking break the purchase flow
  }
}

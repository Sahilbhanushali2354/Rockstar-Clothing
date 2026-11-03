/*
 * Storefront content that admins edit in /admin/settings.
 * Stored in Firestore: settings/storefront. Every field falls back to
 * DEFAULT_SETTINGS so the site never renders empty.
 */

export const SETTINGS_PATH = { collection: "settings", doc: "storefront" } as const;

export interface StoreSettings {
  /** scrolling strip above the navbar */
  announcements: string[];
  /** strip between home sections */
  tickerItems: string[];
  heroBadge: string;
  heroTitle: string;
  /** word(s) shown in the acid block at the end of the hero title */
  heroHighlight: string;
  heroSubtitle: string;
  instagramHandle: string;
  /** shown in footer + used for SEO description */
  tagline: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcements: ["New drops every week", "Order on WhatsApp · Pay via UPI", "Ships across India", "Size help on chat"],
  tickerItems: ["Fresh drops weekly", "Limited stock", "Order on WhatsApp", "Pay via UPI"],
  heroBadge: "New drop is live",
  heroTitle: "Main character",
  heroHighlight: "energy.",
  heroSubtitle:
    "Streetwear, co-ord sets & graphic tees that go viral. Pick your fit, order on WhatsApp, pay via UPI.",
  instagramHandle: "dopamineclub",
  tagline: "Trending streetwear, co-ord sets, graphic tees & viral drops. Order straight on WhatsApp.",
};

const cleanList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const list = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return list.length ? list : fallback;
};

const cleanText = (value: unknown, fallback: string) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
};

export function normalizeSettings(data: Record<string, unknown> | null | undefined): StoreSettings {
  const d = data ?? {};
  return {
    announcements: cleanList(d.announcements, DEFAULT_SETTINGS.announcements),
    tickerItems: cleanList(d.tickerItems, DEFAULT_SETTINGS.tickerItems),
    heroBadge: cleanText(d.heroBadge, DEFAULT_SETTINGS.heroBadge),
    heroTitle: cleanText(d.heroTitle, DEFAULT_SETTINGS.heroTitle),
    heroHighlight: cleanText(d.heroHighlight, DEFAULT_SETTINGS.heroHighlight),
    heroSubtitle: cleanText(d.heroSubtitle, DEFAULT_SETTINGS.heroSubtitle),
    instagramHandle: cleanText(d.instagramHandle, DEFAULT_SETTINGS.instagramHandle).replace(/^@/, ""),
    tagline: cleanText(d.tagline, DEFAULT_SETTINGS.tagline),
  };
}

export const instagramUrl = (handle: string) => `https://instagram.com/${handle.replace(/^@/, "")}`;

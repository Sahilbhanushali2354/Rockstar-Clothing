/*
 * DOPAMINE CLUB design tokens — the ONLY place brand values are defined.
 *
 * Two-tone system, same as the logo:
 *   INK  (#0B0B0F)  — type, borders, hard shadows, inverse sections
 *   ACID (#C6FF00)  — the one accent: CTAs, highlights, badges, focus
 *
 * Everything else is neutral (paper / greys). `danger` exists only for
 * errors and destructive actions — never for decoration.
 *
 * Consumed by:
 *   - app/theme/cssVars.ts   → CSS variables (--dc-*) for Tailwind + CSS
 *   - app/theme/muiTheme.ts  → MUI theme (palette, typography, components)
 */

export const brand = {
  ink: "#0B0B0F",
  acid: "#C6FF00",
  /** slightly deeper acid for hover / pressed states */
  acidDeep: "#B2E600",
  paper: "#F7F5EF",
  white: "#FFFFFF",
  danger: "#FF3B3B",
  whatsapp: "#25D366",
} as const;

export interface ColorScheme {
  /** page background */
  bg: string;
  /** cards, inputs, sheets */
  surface: string;
  /** subtle fills: hovers, skeletons, image placeholders */
  surface2: string;
  /** main text */
  text: string;
  /** secondary text */
  muted: string;
  /** soft dividers / input borders */
  line: string;
  /** hard brutalist edge: strong borders + offset shadows */
  edge: string;
  /** primary accent + the text that sits on it */
  accent: string;
  onAccent: string;
  /** inverse block (e.g. hero, footer, marquee) */
  inverseBg: string;
  inverseText: string;
  inverseAccent: string;
}

export const schemes: Record<"light" | "dark", ColorScheme> = {
  light: {
    bg: brand.paper,
    surface: brand.white,
    surface2: "#EFEDE6",
    text: brand.ink,
    muted: "#5C5C66",
    line: "#DEDBD1",
    edge: brand.ink,
    accent: brand.acid,
    onAccent: brand.ink,
    inverseBg: brand.ink,
    inverseText: brand.paper,
    inverseAccent: brand.acid,
  },
  dark: {
    bg: brand.ink,
    surface: "#141419",
    surface2: "#1D1D24",
    text: brand.paper,
    muted: "#A1A1AB",
    line: "#2B2B34",
    edge: brand.paper,
    accent: brand.acid,
    onAccent: brand.ink,
    // In dark mode the "loud" block flips to acid with ink type.
    inverseBg: brand.acid,
    inverseText: brand.ink,
    inverseAccent: brand.ink,
  },
};

/** localStorage key for the user's light/dark choice (kept from v1). */
export const THEME_STORAGE_KEY = "rockstar-theme";

export const fonts = {
  body: "var(--font-body), system-ui, -apple-system, 'Segoe UI', sans-serif",
  display: "var(--font-display), var(--font-body), system-ui, sans-serif",
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

/** Hard offset shadows (no blur) — the neo-brutalist signature. */
export const shadow = {
  sm: "3px 3px 0 var(--dc-edge)",
  md: "4px 4px 0 var(--dc-edge)",
  lg: "6px 6px 0 var(--dc-edge)",
  accent: "4px 4px 0 var(--dc-accent)",
} as const;

export const motion = {
  fast: "100ms",
  base: "180ms",
} as const;

/**
 * Brand constants. Editable storefront copy (announcements, hero text,
 * Instagram handle) lives in Firestore — see app/lib/storeSettings.ts.
 */
export const STORE = {
  name: "DOPAMINE CLUB",
} as const;

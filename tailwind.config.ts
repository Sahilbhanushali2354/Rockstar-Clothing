import type { Config } from "tailwindcss";

/*
 * Colours point at the --dc-* CSS variables generated from
 * app/theme/tokens.ts, so Tailwind, MUI and plain CSS share one palette.
 */
const config: Config = {
  // Follow the site's theme toggle (`.dark` on <html>), not the OS setting.
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--dc-ink)",
        acid: "var(--dc-acid)",
        paper: "var(--dc-paper)",
        danger: "var(--dc-danger)",
        bg: "var(--dc-bg)",
        surface: "var(--dc-surface)",
        "surface-2": "var(--dc-surface-2)",
        fg: "var(--dc-text)",
        muted: "var(--dc-muted)",
        line: "var(--dc-line)",
        edge: "var(--dc-edge)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        brutal: "4px 4px 0 var(--dc-edge)",
        "brutal-sm": "3px 3px 0 var(--dc-edge)",
        "brutal-lg": "6px 6px 0 var(--dc-edge)",
      },
    },
  },
  plugins: [],
};
export default config;

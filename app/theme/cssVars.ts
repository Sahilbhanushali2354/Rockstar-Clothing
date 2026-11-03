import { brand, schemes, type ColorScheme } from "./tokens";

/*
 * Builds the --dc-* CSS variables from tokens.ts. Rendered server-side in
 * <head> by app/layout.tsx, so colours are correct on first paint.
 */

// surface2 → surface-2, inverseBg → inverse-bg
const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`).replace(/([a-z])(\d)/g, "$1-$2");

const schemeVars = (scheme: ColorScheme) =>
  Object.entries(scheme)
    .map(([key, value]) => `--dc-${kebab(key)}:${value};`)
    .join("");

const brandVars = Object.entries(brand)
  .map(([key, value]) => `--dc-${kebab(key)}:${value};`)
  .join("");

export const themeCss = [
  `:root{${brandVars}${schemeVars(schemes.light)}color-scheme:light;}`,
  `.dark{${schemeVars(schemes.dark)}color-scheme:dark;}`,
].join("\n");

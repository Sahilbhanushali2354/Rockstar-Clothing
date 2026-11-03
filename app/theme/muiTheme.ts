"use client";

import { createTheme, type PaletteOptions } from "@mui/material/styles";

import { brand, fonts, motion, radius, schemes, shadow, type ColorScheme } from "./tokens";

/*
 * MUI theme generated from tokens.ts. Uses MUI CSS variables with the
 * `.dark` class selector — the same class Tailwind's `dark:` uses — so
 * MUI, Tailwind and our CSS all switch together with no flash.
 */

const palette = (scheme: ColorScheme, mode: "light" | "dark"): PaletteOptions => ({
  mode,
  primary: { main: brand.acid, dark: brand.acidDeep, contrastText: brand.ink },
  secondary: { main: scheme.text, contrastText: scheme.bg },
  error: { main: brand.danger },
  success: { main: brand.acidDeep, contrastText: brand.ink },
  background: { default: scheme.bg, paper: scheme.surface },
  text: { primary: scheme.text, secondary: scheme.muted },
  divider: scheme.line,
  action: {
    hover: scheme.surface2,
    selected: scheme.surface2,
  },
});

const hardButton = {
  border: "2px solid var(--dc-edge)",
  boxShadow: shadow.sm,
  transition: `transform ${motion.fast}, box-shadow ${motion.fast}, background-color ${motion.base}`,
  "&:hover": {
    transform: "translate(-1px, -1px)",
    boxShadow: shadow.md,
  },
  "&:active": {
    transform: "translate(3px, 3px)",
    boxShadow: "0 0 0 var(--dc-edge)",
  },
  "&.Mui-disabled": {
    border: "2px solid var(--dc-line)",
    boxShadow: "none",
    transform: "none",
  },
};

export const muiTheme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: { palette: palette(schemes.light, "light") },
    dark: { palette: palette(schemes.dark, "dark") },
  },

  shape: { borderRadius: radius.md },

  typography: {
    fontFamily: fonts.body,
    h1: { fontFamily: fonts.display, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95 },
    h2: { fontFamily: fonts.display, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1 },
    h3: { fontFamily: fonts.display, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 },
    h4: { fontFamily: fonts.display, fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontFamily: fonts.display, fontWeight: 700 },
    h6: { fontFamily: fonts.display, fontWeight: 700 },
    overline: { fontWeight: 800, letterSpacing: "0.18em", lineHeight: 1.6 },
    button: { fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "var(--dc-bg)", color: "var(--dc-text)" },
        "::selection": { backgroundColor: brand.acid, color: brand.ink },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          minHeight: 44,
          paddingInline: 20,
        },
        sizeLarge: { minHeight: 52, fontSize: "0.95rem" },
        sizeSmall: { minHeight: 36, paddingInline: 12 },
        contained: hardButton,
        outlined: {
          ...hardButton,
          boxShadow: "none",
          color: "var(--dc-text)",
          backgroundColor: "var(--dc-surface)",
          "&:hover": { ...hardButton["&:hover"], backgroundColor: "var(--dc-surface)" },
        },
        text: { color: "var(--dc-text)" },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "var(--dc-text)",
          borderRadius: radius.md,
          "&:hover": { backgroundColor: "var(--dc-surface-2)" },
        },
      },
    },

    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          border: "1px solid var(--dc-line)",
          backgroundColor: "var(--dc-surface)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: "0.7rem",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: "var(--dc-surface)",
          "& .MuiOutlinedInput-notchedOutline": { borderWidth: 2, borderColor: "var(--dc-line)" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--dc-edge)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--dc-edge)", borderWidth: 2 },
          "&.Mui-focused": { boxShadow: shadow.accent },
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: "var(--dc-line)" } },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: brand.acid,
          color: brand.ink,
          fontWeight: 900,
          border: `2px solid ${brand.ink}`,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "var(--dc-bg)", borderRight: "2px solid var(--dc-edge)" },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          border: "2px solid var(--dc-edge)",
          boxShadow: shadow.md,
          borderRadius: radius.md,
          marginTop: 8,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: "var(--dc-text)", color: "var(--dc-bg)", fontWeight: 700 },
      },
    },

    MuiCircularProgress: {
      defaultProps: { color: "inherit" },
    },
  },
});

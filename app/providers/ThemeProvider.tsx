"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { CssBaseline } from "@mui/material";
import {
  ThemeProvider as MuiThemeProvider,
  useColorScheme,
} from "@mui/material/styles";

import { muiTheme } from "../theme/muiTheme";
import { THEME_STORAGE_KEY } from "../theme/tokens";

type Mode = "light" | "dark";

type ThemeContextType = {
  /** Resolved mode actually on screen. */
  mode: Mode;
  toggleTheme: () => void;
  setMode: (mode: Mode | "system") => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useThemeMode must be used inside ThemeProvider");
  return context;
}

/* Bridges MUI's colour-scheme state to our simple { mode, toggleTheme } API. */
function ModeBridge({ children }: { children: React.ReactNode }) {
  const { mode, systemMode, setMode } = useColorScheme();

  const resolved: Mode =
    (mode === "system" ? systemMode : mode) === "dark" ? "dark" : "light";

  const toggleTheme = useCallback(
    () => setMode(resolved === "dark" ? "light" : "dark"),
    [resolved, setMode],
  );

  const value = useMemo(
    () => ({
      mode: resolved,
      toggleTheme,
      setMode: (next: Mode | "system") => setMode(next),
    }),
    [resolved, toggleTheme, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/*
 * One theme for the whole app:
 *  - colours/typography/components come from app/theme/tokens.ts
 *  - MUI toggles the `.dark` class on <html>, which also drives Tailwind
 *    `dark:` and the --dc-* CSS variables.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MuiThemeProvider
      theme={muiTheme}
      modeStorageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <CssBaseline enableColorScheme />
      <ModeBridge>{children}</ModeBridge>
    </MuiThemeProvider>
  );
}

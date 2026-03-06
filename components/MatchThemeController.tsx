"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/lib/store/themeStore";

export function MatchThemeController({ win }: { win?: boolean }) {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    if (win === undefined) {
      setTheme('default');
    } else {
      setTheme(win ? 'victory' : 'defeat');
    }

    return () => setTheme('default');
  }, [win, setTheme]);

  return null;
}

export function ThemeSetter({ theme }: { theme: Theme }) {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    setTheme(theme);
    return () => setTheme('default');
  }, [theme, setTheme]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/lib/store/themeStore";
import { useMatchStore } from "@/lib/store/matchStore";
import { getChampionTheme } from "@/lib/champion-themes";

export function MatchThemeController({ win, champion }: { win?: boolean, champion?: string }) {
  const { setTheme } = useThemeStore();
  const { reset: resetMatchState } = useMatchStore();

  useEffect(() => {
    const themeType: Theme = win === undefined ? 'default' : (win ? 'victory' : 'defeat');
    const champTheme = champion ? getChampionTheme(champion) : null;
    
    setTheme(themeType, champTheme?.nexus);

    return () => {
      setTheme('default');
      resetMatchState();
    };
  }, [win, champion, setTheme, resetMatchState]);

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

import { create } from 'zustand';

export type Theme = 'default' | 'victory' | 'defeat' | 'profile';

interface ThemeState {
  theme: Theme;
  customColors?: {
    bg: [number, number, number];
    r1: [number, number, number];
    r2: [number, number, number];
  };
  setTheme: (theme: Theme, customColors?: ThemeState["customColors"]) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  setTheme: (theme, customColors) => set({ theme, customColors }),
}));

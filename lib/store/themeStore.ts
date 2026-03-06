import { create } from 'zustand';

export type Theme = 'default' | 'victory' | 'defeat' | 'profile';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  setTheme: (theme) => set({ theme }),
}));

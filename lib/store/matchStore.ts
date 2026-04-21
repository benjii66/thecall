import { create } from 'zustand';

interface MatchState {
  highlightedMinute: number | null;
  highlightedLabel: string | null;
  setHighlightedMinute: (minute: number | null, label?: string | null) => void;
  // Permet de déclencher un scroll vers un point précis de la timeline
  scrollToMinute: number | null;
  setScrollToMinute: (minute: number | null) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  highlightedMinute: null,
  highlightedLabel: null,
  setHighlightedMinute: (minute, label = null) => 
    set({ highlightedMinute: minute, highlightedLabel: label }),
  scrollToMinute: null,
  setScrollToMinute: (minute) => set({ scrollToMinute: minute }),
  reset: () => set({ highlightedMinute: null, highlightedLabel: null, scrollToMinute: null }),
}));

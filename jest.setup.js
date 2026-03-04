
require("@testing-library/jest-dom");
const { TextEncoder, TextDecoder } = require("util");

// Polyfill text encoding
Object.assign(global, { TextEncoder, TextDecoder });

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill matchMedia
if (typeof window !== "undefined") {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock Language Hook globally
const translations = {
  "profile.insight.strength": "Point fort",
  "profile.insight.weakness": "À améliorer",
  "profile.insight.recommendation": "Recommandation",
  "profile.insight.priority": "Priorité",
  "profile.playstyle.aggression": "Agression",
  "profile.playstyle.objectiveFocus": "Focus objectifs",
  "profile.playstyle.teamFightPresence": "Présence team fights",
  "profile.playstyle.high": "Élevé",
  "profile.playstyle.medium": "Moyen",
  "profile.playstyle.low": "Faible",
};

jest.mock("@/lib/language", () => ({
  useLanguage: () => ({
    t: (key) => translations[key] || key,
    language: "fr",
    setLanguage: jest.fn(),
  }),
}));

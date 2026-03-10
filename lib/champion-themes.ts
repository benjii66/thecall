// lib/champion-themes.ts

export type ChampionTheme = {
  id: string;
  color: string; // Hex for UI
  glow: string; // Tailwind glow class
  border: string;
  bg: string;
  nexus: {
    bg: [number, number, number];
    r1: [number, number, number];
    r2: [number, number, number];
  };
};

const THEMES: Record<string, ChampionTheme> = {
  void: {
    id: "void",
    color: "#a855f7",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    nexus: {
      bg: [0.02, 0.01, 0.04],
      r1: [0.3, 0.0, 0.5],
      r2: [0.6, 0.2, 1.0],
    },
  },
  freljord: {
    id: "freljord",
    color: "#06b6d4",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    nexus: {
      bg: [0.01, 0.02, 0.04],
      r1: [0.0, 0.1, 0.4],
      r2: [0.0, 0.8, 1.0],
    },
  },
  noxus: {
    id: "noxus",
    color: "#ef4444",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    nexus: {
      bg: [0.03, 0.01, 0.01],
      r1: [0.4, 0.0, 0.1],
      r2: [1.0, 0.2, 0.2],
    },
  },
  demacia: {
    id: "demacia",
    color: "#eab308",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.4)]",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    nexus: {
      bg: [0.03, 0.03, 0.01],
      r1: [0.5, 0.4, 0.0],
      r2: [1.0, 0.9, 0.2],
    },
  },
  ionia: {
    id: "ionia",
    color: "#ec4899",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.4)]",
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    nexus: {
      bg: [0.03, 0.01, 0.03],
      r1: [0.5, 0.0, 0.3],
      r2: [1.0, 0.2, 0.6],
    },
  },
  shadowisles: {
    id: "shadowisles",
    color: "#10b981",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    nexus: {
      bg: [0.01, 0.03, 0.02],
      r1: [0.0, 0.4, 0.2],
      r2: [0.0, 1.0, 0.6],
    },
  },
  shurima: {
    id: "shurima",
    color: "#f59e0b",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    nexus: {
      bg: [0.03, 0.02, 0.01],
      r1: [0.5, 0.3, 0.0],
      r2: [1.0, 0.7, 0.0],
    },
  },
  piltover: {
    id: "piltover",
    color: "#3b82f6",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    nexus: {
      bg: [0.01, 0.02, 0.05],
      r1: [0.0, 0.2, 0.5],
      r2: [0.3, 0.6, 1.0],
    },
  },
  standard: {
    id: "standard",
    color: "#06b6d4",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    nexus: {
      bg: [0.01, 0.02, 0.05],
      r1: [0.0, 0.1, 0.5],
      r2: [0.0, 0.8, 1.0],
    },
  },
};

const CHAMPION_TO_REGION: Record<string, string> = {
  // Void
  Kassadin: "void", KhaZix: "void", KaiSa: "void", Malzahar: "void", VelKoz: "void", ChoGath: "void", KogMaw: "void", BelVeth: "void",
  // Freljord
  Ashe: "freljord", Sejuani: "freljord", Braum: "freljord", Olaf: "freljord", Tryndamere: "freljord", Anivia: "freljord", Lissandra: "freljord", Volibear: "freljord", Nunu: "freljord",
  // Noxus
  Darius: "noxus", Draven: "noxus", Katarina: "noxus", Swain: "noxus", Sion: "noxus", Talon: "noxus", Cassiopeia: "noxus", Samira: "noxus", Vladimir: "noxus", Kled: "noxus", LeBlanc: "noxus",
  // Demacia
  Garen: "demacia", Lux: "demacia", JarvanIV: "demacia", XinZhao: "demacia", Quinn: "demacia", Lucian: "demacia", Sona: "demacia", Fiora: "demacia", Shyvana: "demacia", Galio: "demacia", Vayne: "demacia",
  // Ionia
  Ahri: "ionia", Yasuo: "ionia", Yone: "ionia", Akali: "ionia", Zed: "ionia", Kennen: "ionia", Shen: "ionia", LeeSin: "ionia", MasterYi: "ionia", Irelia: "ionia", Karma: "ionia", Rakan: "ionia", Xayah: "ionia",
  // Shadow Isles
  Thresh: "shadowisles", Viego: "shadowisles", Gwen: "shadowisles", Hecarim: "shadowisles", Kalista: "shadowisles", Karthus: "shadowisles", Mordekaiser: "shadowisles", Yorick: "shadowisles", Elise: "shadowisles", Maokai: "shadowisles",
  // Shurima
  Azir: "shurima", Nasus: "shurima", Renekton: "shurima", Sivir: "shurima", Taliyah: "shurima", Amumu: "shurima", Rammus: "shurima", Skarner: "shurima", Xerath: "shurima",
  // Piltover & Zaun
  Vi: "piltover", Jinx: "piltover", Ekko: "piltover", Caitlyn: "piltover", Jayce: "piltover", Ezreal: "piltover", Viktor: "piltover", Warwick: "piltover", Urgot: "piltover", DrMundo: "piltover", Singed: "piltover", Twitch: "piltover",
};

export function getChampionTheme(championName: string): ChampionTheme {
  const region = CHAMPION_TO_REGION[championName];
  return THEMES[region] || THEMES.standard;
}

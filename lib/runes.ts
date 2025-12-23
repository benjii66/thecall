// lib/runes.ts
import type { RiotParticipant } from "@/lib/riotTypes";

type RuneStyle = {
  id: number;
  key: string;
  icon: string;
  slots: {
    runes: {
      id: number;
      key: string;
      icon: string;
    }[];
  }[];
};

type RunesReforged = RuneStyle[];

let runeMapCache: Map<number, string> | null = null;

export async function getRuneMap(): Promise<Map<number, string>> {
  if (runeMapCache) return runeMapCache;

  const res = await fetch(
    "https://ddragon.leagueoflegends.com/cdn/14.18.1/data/en_US/runesReforged.json",
    { cache: "force-cache" }
  );

  const data = (await res.json()) as RunesReforged;

  const map = new Map<number, string>();

  for (const style of data) {
    for (const slot of style.slots) {
      for (const rune of slot.runes) {
        map.set(rune.id, rune.icon);
      }
    }
  }

  runeMapCache = map;
  return map;
}

const RUNE_BASE =
  "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles";

export function runeIcon(path: string) {
  return `${RUNE_BASE}/${path}.png`;
}

export function resolveRunesFromParticipant(
  p: RiotParticipant,
  runeMap: Map<number, string>
): string[] {
  return p.perks.styles
    .flatMap((style) => style.selections.map((sel) => runeMap.get(sel.perk)))
    .filter((r): r is string => Boolean(r))
    .map(runeIcon);
}

"use client";

import { BuildDropdown } from "@/components/BuildDropdown";
import type { BuildData } from "@/types/match";

function runeIcon(path: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/${path}`;
}


export function MatchBuildSection({
  you,
  opponent,
}: {
  you: BuildData;
  opponent?: BuildData; // 👈 IMPORTANT
}) {
  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-black/5 p-6">
      <h3 className="mb-6 text-sm font-semibold uppercase tracking-wide text-white/60">
        Builds dans la partie
      </h3>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* YOU */}
        <BuildDropdown title="Ton build" items={you.items} runes={you.runes} />

        {/* OPPONENT */}
        {opponent && (
          <BuildDropdown
            title="Build de l’adversaire"
            items={opponent.items}
            runes={opponent.runes}
          />
        )}
      </div>
    </section>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Image from "next/image";
import { LoadingSpinner } from "./LoadingSpinner";
import type { MatchListItem } from "@/types/matchList";
import { GlassDropdown } from "@/components/GlassDropdown";

const DD_VERSION = "14.23.1";

export function MatchSelector({
  matches,
  selected,
}: {
  matches: MatchListItem[];
  selected: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(matchId: string) {
    if (!matchId || matchId === selected) return;

    startTransition(() => {
      const sp = new URLSearchParams(params.toString());
      sp.set("matchId", matchId);
      router.push(`/match?${sp.toString()}`);
    });
  }

  const options = matches.map((m) => ({
    value: m.id,
    label: m.label,
    icon: (
      <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/20">
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${m.champion}.png`}
          alt={m.champion}
          fill
          className="object-cover"
        />
      </div>
    ),
  }));

  return (
    <div className="relative z-10 w-full sm:w-[320px]">
      <GlassDropdown
        value={selected}
        onChange={onChange}
        options={options}
        disabled={isPending}
        className="w-full"
        maxHeight="400px"
      />
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
          <LoadingSpinner size={14} />
        </div>
      )}
    </div>
  );
}

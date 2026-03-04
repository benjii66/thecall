"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useLanguage } from "@/lib/language";
import { GlassDropdown, DropdownOption } from "@/components/GlassDropdown";
import { Layers, Scroll, Trophy } from "lucide-react";

type MatchType = "all" | "draft" | "ranked";

export function MatchTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const type = (searchParams.get("type") ?? "all") as MatchType;
  const matchId = searchParams.get("matchId");

  function onChange(newType: string) {
    if (newType === type) return;

    startTransition(() => {
      const params = new URLSearchParams();

      params.set("type", newType);
      if (matchId) params.set("matchId", matchId);

      router.push(`/match?${params.toString()}`);
    });
  }

  const options: DropdownOption[] = [
    { value: "all", label: t("matchType.all"), icon: <Layers className="h-4 w-4" /> },
    { value: "draft", label: t("matchType.draft"), icon: <Scroll className="h-4 w-4" /> },
    { value: "ranked", label: t("matchType.ranked"), icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <div className="relative z-20">
      <GlassDropdown
        value={type}
        onChange={onChange}
        options={options}
        disabled={isPending}
        className="w-[240px]"
      />
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
          <LoadingSpinner size={14} />
        </div>
      )}
    </div>
  );
}

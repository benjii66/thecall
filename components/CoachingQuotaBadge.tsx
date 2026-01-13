"use client";

import { Lock, Zap } from "lucide-react";
import Link from "next/link";

interface CoachingQuotaBadgeProps {
  remaining: number;
  limit: number;
  tier: "free" | "pro";
}

export function CoachingQuotaBadge({
  remaining,
  limit,
  tier,
}: CoachingQuotaBadgeProps) {
  if (tier === "pro") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
        <Zap className="h-4 w-4 text-cyan-300" />
        <span className="text-sm font-medium text-cyan-300">
          Coaching Pro • Illimité
        </span>
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-medium text-amber-300">
              Quota épuisé (0/{limit} restants)
            </span>
          </div>
          <Link
            href="/pricing"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400"
          >
            Upgrade Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
      <span className="text-sm text-white/70">
        Coaching Free : <span className="font-semibold text-white">{remaining}/{limit}</span> restants ce mois-ci
      </span>
    </div>
  );
}

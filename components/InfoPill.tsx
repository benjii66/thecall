"use client";

import { useLanguage } from "@/lib/language";

type InfoPillProps = {
  labelKey?: string;
  label?: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
};

export function InfoPill({ labelKey, label, value, tone = "neutral" }: InfoPillProps) {
  const { t } = useLanguage();
  const displayLabel = labelKey ? t(labelKey) : label || "";
  
  const toneCls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : tone === "bad"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : "border-white/10 bg-black/20 text-white";

  return (
    <div className={`rounded-2xl border p-4 ${toneCls}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
        {displayLabel}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

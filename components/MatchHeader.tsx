"use client";

import { useLanguage } from "@/lib/language";
import { HoloTypography } from "@/components/HoloTypography";

export function MatchHeader() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-2">
      <div className="opacity-60">
        <HoloTypography variant="subtitle" className="text-sm uppercase tracking-[0.2em]">
          {t("match.matchCenter")}
        </HoloTypography>
      </div>
      <HoloTypography variant="title" className="text-3xl lg:text-4xl">
        {t("match.matchOverview")}
      </HoloTypography>
      <p className="text-sm text-white/50 max-w-md">
        {t("match.matchOverviewDesc")}
      </p>
    </div>
  );
}

"use client";

import { useLanguage } from "@/lib/language";

export function PuuidMissingMessage() {
  const { t } = useLanguage();
  
  return (
    <>
      <p className="text-lg font-semibold">{t("match.puuidMissing")}</p>
      <p className="mt-2 text-sm text-white/60">
        {t("match.puuidMissingDesc")}{" "}
        <span className="text-white/90 font-semibold">MY_PUUID</span> {t("match.puuidMissingIn")}{" "}
        <span className="text-white/90 font-semibold">.env.local</span>.
      </p>
    </>
  );
}

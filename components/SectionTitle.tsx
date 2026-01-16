"use client";

import { useLanguage } from "@/lib/language";

type SectionTitleProps = {
  title?: string;
  subtitle?: string;
  titleKey?: string;
  subtitleKey?: string;
};

export function SectionTitle({ title, subtitle, titleKey, subtitleKey }: SectionTitleProps) {
  const { t } = useLanguage();
  
  const displayTitle = titleKey ? t(titleKey) : title;
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle;
  
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold tracking-tight">{displayTitle}</h3>
      {displaySubtitle && (
        <p className="mt-1 text-sm text-white/55">{displaySubtitle}</p>
      )}
    </div>
  );
}

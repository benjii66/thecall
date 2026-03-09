
"use client";

import { useLanguage } from "@/lib/language";

export function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="w-full py-8 mt-20 border-t border-white/5 bg-[#05060b] text-neutral-500 text-xs">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        
        {/* Riot Games Legal Jibber Jabber */}
        <p className="leading-relaxed max-w-3xl">
          The Call isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
        </p>

        <div className="flex gap-6 mt-2">
          <a href="/privacy" className="hover:text-neutral-300 transition-colors">{t("footer.privacy")}</a>
          <a href="/legal" className="hover:text-neutral-300 transition-colors">{t("footer.legal")}</a>
        </div>

        <p className="mt-4">
          &copy; {new Date().getFullYear()} The Call. {t("footer.crafted")}
        </p>
      </div>
    </footer>
  );
}

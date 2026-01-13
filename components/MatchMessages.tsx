"use client";

import { useLanguage } from "@/lib/language";

export function MatchErrorMessages({ error }: { error?: string }) {
  const { t } = useLanguage();
  
  return (
    <>
      <p className="text-lg font-semibold">
        {error ? t("matches.error") : t("matches.noMatches")}
      </p>
      <p className="mt-2 text-sm text-white/60">
        {error || t("matches.errorDesc")}
      </p>
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-black/40 p-4 text-left">
          <p className="text-xs font-semibold text-red-200 mb-2">
            {t("matches.errorSolution")}
          </p>
          <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
            <li>{t("matches.errorStep1")}</li>
            <li>
              {t("matches.errorStep2")}{" "}
              <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300 hover:text-cyan-200">
                developer.riotgames.com
              </a>
            </li>
            <li>{t("matches.errorStep3")}</li>
          </ol>
        </div>
      )}
    </>
  );
}

export function MatchListHeader() {
  const { t } = useLanguage();
  
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t("matches.title")}</h1>
      <p className="mt-2 text-sm text-white/60">
        {t("matches.subtitle")}
      </p>
    </div>
  );
}

export function MatchNotFoundMessage() {
  const { t } = useLanguage();
  
  return (
    <>
      <p className="text-lg font-semibold">{t("match.notFound")}</p>
      <p className="mt-2 text-sm text-white/60">
        {t("match.notFoundDesc")}
      </p>
    </>
  );
}

export function MatchUnavailableMessage() {
  const { t } = useLanguage();
  
  return (
    <>
      <p className="text-lg font-semibold">{t("match.unavailable")}</p>
      <p className="mt-2 text-sm text-white/60">
        {t("match.unavailableDesc")}
      </p>
    </>
  );
}

export function MatchNoOpponentMessage() {
  const { t } = useLanguage();
  
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/60">
      {t("match.noOpponent")}
    </div>
  );
}

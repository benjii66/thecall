// app/match/page.tsx
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { MatchSelector } from "@/components/MatchSelector";
import { MatchTypeFilter } from "@/components/MatchTypeFilter";
import { HorizontalTimeline } from "@/components/HorizontalTimeline";
import { MatchErrorMessages, MatchListHeader, MatchNotFoundMessage, MatchUnavailableMessage, MatchNoOpponentMessage } from "@/components/MatchMessages";
import { MatchBuildSection } from "@/components/MatchBuildSection";
import { WinProbabilityChart } from "@/components/WinProbabilityChart";
import { AnimatedSection, AnimatedItem } from "@/components/AnimatedSection";
import { TabContentWrapper } from "@/components/TabContentWrapper";
import { MatchList } from "@/components/MatchList";
import { MatchDetailTransitionWrapper } from "@/components/MatchDetailTransitionWrapper";
import { CoachTab } from "@/components/CoachTab";
import { Suspense } from "react";

import Image from "next/image";

import type { MatchPageData, TeamPlayer } from "@/types/match";
import type { MatchListItem } from "@/types/matchList";
import type { GameType } from "@/types/gameType";

import { computeWinProbability } from "@/lib/winProbability";

/* ----------------------------------
   DATA DRAGON
---------------------------------- */

const DD_VERSION = "14.18.1";

const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${name}.png`;

const champSplash = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`;

/* ----------------------------------
   BASE URL (server fetch)
---------------------------------- */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/* ----------------------------------
   SERVER FETCH
---------------------------------- */

function hasMatchesArray(x: unknown): x is { matches: MatchListItem[] } {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return Array.isArray(o.matches);
}

async function getMatches(
  puuid: string,
  type: GameType
): Promise<{ matches: MatchListItem[]; error?: string }> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/matches?puuid=${encodeURIComponent(puuid)}&type=${type}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return { matches: [] };
    }

    const json: unknown = await res.json();

    // Vérifier si c'est une réponse avec erreur
    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof (json as { error?: unknown }).error === "string"
    ) {
      return {
        matches: (json as { matches?: MatchListItem[] }).matches ?? [],
        error: (json as { error: string }).error,
      };
    }

    if (Array.isArray(json)) return { matches: json as MatchListItem[] };
    if (hasMatchesArray(json)) return { matches: json.matches };

    return { matches: [] };
  } catch {
    return { matches: [] };
  }
}

function isMatchPageData(x: unknown): x is MatchPageData {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.me === "object" && o.me !== null && Array.isArray(o.timelineEvents)
  );
}

async function getMatch(id: string): Promise<MatchPageData | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/match/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json: unknown = await res.json();

    // MatchPageData direct
    if (isMatchPageData(json)) return json;

    // Supporte { data: MatchPageData }
    if (
      json &&
      typeof json === "object" &&
      "data" in json &&
      isMatchPageData((json as { data?: unknown }).data)
    ) {
      return (json as { data: MatchPageData }).data;
    }

    return null;
  } catch {
    return null;
  }
}

/* ----------------------------------
   PAGE
---------------------------------- */

// Force dynamic rendering to avoid Suspense issues with useSearchParams
export const dynamic = 'force-dynamic';

type SearchParams = {
  matchId?: string;
  type?: GameType;
  tab?: "overview" | "coach";
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const type: GameType = (sp.type ?? "all") as GameType;
  const matchId = sp.matchId;
  const activeTab = (sp.tab ?? "overview") as "overview" | "coach";

  // ✅ on supporte MY_PUUID (et fallback sur d'autres noms si besoin)
  const puuid =
    process.env.MY_PUUID ??
    process.env.NEXT_PUBLIC_PUUID ??
    process.env.PUUID ??
    "";

  if (!puuid) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <NavbarWrapper />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <p className="text-lg font-semibold">PUUID manquant</p>
            <p className="mt-2 text-sm text-white/60">
              Ajoute{" "}
              <span className="text-white/90 font-semibold">MY_PUUID</span> dans{" "}
              <span className="text-white/90 font-semibold">.env.local</span>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const matchesResult = await getMatches(puuid, type);
  const matches = matchesResult.matches;

  if (!matches.length) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <NavbarWrapper />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <MatchErrorMessages error={matchesResult.error} />
          </div>
        </div>
      </main>
    );
  }

  // Si pas de matchId, afficher la liste des matchs
  if (!matchId) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <NavbarWrapper />
        <BackgroundFX />
        <section className="relative mx-auto max-w-4xl px-6 pb-16 pt-10">
          <MatchListHeader />

          <div className="rounded-2xl border border-white/10 bg-black/30 p-2 mb-6">
            <Suspense fallback={<div className="h-10" />}>
              <MatchTypeFilter />
            </Suspense>
          </div>

          <Suspense fallback={<div className="h-20" />}>
            <MatchList matches={matches} />
          </Suspense>
        </section>
      </main>
    );
  }

  // Match sélectionné - charger les détails
  const selectedMatchId = matches.some((m) => m.id === matchId) ? matchId : matches[0]?.id;

  if (!selectedMatchId) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <NavbarWrapper />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <MatchNotFoundMessage />
          </div>
        </div>
      </main>
    );
  }

  const data = await getMatch(selectedMatchId);

  if (!data || !("me" in data)) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <NavbarWrapper />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <MatchUnavailableMessage />
          </div>
        </div>
      </main>
    );
  }

  const finalMatchId = selectedMatchId;

  // Fetch coaching report (avec vérification tier)
  let coachingReport: import("@/types/coaching").CoachingReport | null = null;
  let coachingQuota: { remaining: number; limit: number } | null = null;
  let coachingTier: "free" | "pro" = "free";
  
  try {
    const coachingRes = await fetch(`${BASE_URL}/api/coaching`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchData: data }),
      cache: "no-store",
    });
    if (coachingRes.ok) {
      const coachingJson = (await coachingRes.json()) as {
        report?: import("@/types/coaching").CoachingReport;
        quota?: { remaining: number; limit: number };
        tier?: "free" | "pro";
      };
      coachingReport = coachingJson.report ?? null;
      coachingQuota = coachingJson.quota ?? null;
      coachingTier = coachingJson.tier ?? "free";
    }
  } catch (err) {
    console.error("Failed to fetch coaching report:", err);
  }

  // Fallback si pas de rapport
  const auditPositive = coachingReport?.positives.map((p) => p.description) ?? [
    "Bon tempo early (objectifs sécurisés)",
    "Bonne présence en fights",
    "Build cohérent avec ton rôle",
  ];
  const auditNegative = coachingReport?.negatives.map((n) => n.description) ?? [
    "KP perfectible sur mid game",
    "Trop de gold non converti en tempo",
    "Vision à optimiser avant objectifs",
  ];

  return (
    <main className="min-h-screen text-white bg-[#05060b]">
      <NavbarWrapper />

      {/* BACKGROUND LAYER (client LoL vibes) */}
      <BackgroundFX />

      <MatchDetailTransitionWrapper matchId={finalMatchId}>
        <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-10">
        {/* HERO / HEADER */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                The Call • Match Center
              </p>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Match Overview
              </h1>
              <p className="text-sm text-white/60">
                Timeline, duel, builds et audit IA — style client LoL.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2">
                <MatchTypeFilter />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2">
                <Suspense fallback={<div className="h-10" />}>
                  <MatchSelector matches={matches} selected={finalMatchId} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* mini info bar */}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoPill
              label="Résultat"
              value={data.me.win ? "VICTOIRE" : "DÉFAITE"}
              tone={data.me.win ? "good" : "bad"}
            />
            <InfoPill label="Ton rôle" value={data.me.role} />
            <InfoPill label="Ton champion" value={data.me.champion} />
          </div>
        </div>

        {/* TAB CONTENT */}
        <TabContentWrapper activeTab={activeTab}>
          {activeTab === "overview" && (
            <>
              {/* TIMELINE */}
              <AnimatedSection>
                <section className="mt-10">
                  <SectionTitle title="Timeline" subtitle="Objectifs & events clés" />
                  <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
                    <HorizontalTimeline events={data.timelineEvents} />
                    <WinProbabilityChart
                      data={computeWinProbability(data.timelineEvents)}
                    />
                  </div>
                </section>
              </AnimatedSection>

              {/* YOU vs OPPONENT */}
              <AnimatedSection>
                <section className="mt-10">
                  <SectionTitle
                    title="Duel"
                    subtitle="Focus principal : toi vs vis-à-vis"
                  />
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-stretch">
                    <AnimatedItem>
                      <DuelCard
                        color="cyan"
                        title="You"
                        champion={data.me.champion}
                        role={data.me.role}
                        kda={data.me.kda}
                        kp={data.me.kp}
                        gold={data.me.gold}
                        win={data.me.win}
                      />
                    </AnimatedItem>
                    <div className="flex lg:hidden flex-col items-center justify-center gap-2 py-2">
                      <div className="text-white/20 font-semibold text-3xl">VS</div>
                      <div
                        className={`rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide
                          ${
                            data.me.win
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                              : "border-red-400/30 bg-red-500/10 text-red-200"
                          }`}
                      >
                        {data.me.win ? "VICTOIRE" : "DÉFAITE"}
                      </div>
                    </div>
                    <div className="hidden lg:flex flex-col items-center justify-center gap-3">
                      <div className="text-white/20 font-semibold text-5xl">VS</div>
                      <div
                        className={`rounded-full border px-5 py-2 text-sm font-semibold tracking-wide
                          ${
                            data.me.win
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                              : "border-red-400/30 bg-red-500/10 text-red-200"
                          }`}
                      >
                        {data.me.win ? "VICTOIRE" : "DÉFAITE"}
                      </div>
                    </div>
                    {data.opponent ? (
                      <AnimatedItem>
                        <DuelCard
                          color="red"
                          title="Opponent"
                          champion={data.opponent.champion}
                          role={data.opponent.role}
                          kda={data.opponent.kda}
                          kp={data.opponent.kp}
                          gold={data.opponent.gold}
                          win={!data.me.win}
                        />
                      </AnimatedItem>
                    ) : (
                      <MatchNoOpponentMessage />
                    )}
                  </div>
                </section>
              </AnimatedSection>

              {/* BUILDS */}
              <AnimatedSection>
                <section className="mt-10">
                  <SectionTitle
                    title="Builds"
                    subtitle="Items & runes utilisés dans la game"
                  />
                  <div className="mt-4">
                    <MatchBuildSection
                      you={data.me.build}
                      opponent={data.opponent?.build}
                    />
                  </div>
                </section>
              </AnimatedSection>

              {/* TEAMS */}
              <AnimatedSection>
                <section className="mt-10">
                  <SectionTitle title="Teams" subtitle="Lisible, compact, efficace" />
                  <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <AnimatedItem>
                      <TeamList title="Your Team" team={data.allyTeam} tone="ally" />
                    </AnimatedItem>
                    <AnimatedItem>
                      <TeamList title="Enemy Team" team={data.enemyTeam} tone="enemy" />
                    </AnimatedItem>
                  </div>
                </section>
              </AnimatedSection>
            </>
          )}

          {activeTab === "coach" && (
            <CoachTab
              coachingReport={coachingReport}
              matchData={data}
              auditPositive={auditPositive}
              auditNegative={auditNegative}
              initialQuota={coachingQuota}
              initialTier={coachingTier}
            />
          )}
        </TabContentWrapper>
        </section>
      </MatchDetailTransitionWrapper>
    </main>
  );
}

/* ----------------------------------
   UI PARTS
---------------------------------- */

function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] noise" />
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        ) : null}
      </div>
      <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
    </div>
  );
}

function InfoPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : tone === "bad"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : "border-white/10 bg-black/20 text-white";

  return (
    <div className={`rounded-2xl border p-4 ${toneCls}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DuelCard({
  title,
  champion,
  role,
  kda,
  kp,
  gold,
  color,
  win,
}: {
  title: string;
  champion: string;
  role: string;
  kda: string;
  kp: number;
  gold: number;
  color: "cyan" | "red";
  win: boolean;
}) {
  const borderGlow =
    color === "cyan"
      ? "shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_30px_100px_rgba(0,0,0,0.65)]"
      : "shadow-[0_0_0_1px_rgba(248,113,113,0.14),0_30px_100px_rgba(0,0,0,0.65)]";

  const ring = color === "cyan" ? "ring-cyan-400/20" : "ring-red-400/20";

  const badge = win
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
    : "border-red-400/30 bg-red-500/10 text-red-200";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur ${borderGlow} ring-1 ${ring}`}
    >
      <Image
        src={champSplash(champion)}
        alt=""
        fill
        className="object-cover opacity-[0.12]"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.75),rgba(0,0,0,0.35),rgba(0,0,0,0.75))]" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_260px_at_15%_15%,rgba(255,255,255,0.10),transparent_60%)]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={champIcon(champion)}
                alt={champion}
                width={54}
                height={54}
                className="rounded-xl"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] tracking-wide text-white/80">
                {role}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                {title}
              </p>
              <h3 className="text-lg font-semibold leading-tight">
                {champion}
              </h3>
            </div>
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}
          >
            {win ? "WIN" : "LOSS"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="KDA" value={kda} />
          <Stat label="KP" value={`${kp}%`} />
          <Stat label="Gold" value={`${gold}`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/90">{value}</p>
    </div>
  );
}

function TeamList({
  title,
  team,
  tone,
}: {
  title: string;
  team: TeamPlayer[];
  tone: "ally" | "enemy";
}) {
  const headerTone = tone === "ally" ? "text-cyan-200/90" : "text-red-200/90";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${headerTone}`}>{title}</h3>
        <div className="h-px w-24 bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
      </div>

      <ul className="space-y-2">
        {team.map((p) => (
          <li
            key={`${title}-${p.champion}`}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
          >
            <Image
              src={champIcon(p.champion)}
              alt={p.champion}
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="flex-1 text-sm text-white/90">{p.champion}</span>
            <span className="text-sm text-white/55">{p.kda}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuditCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "good" | "bad";
  items: string[];
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10"
      : "border-red-400/20 bg-red-500/10";

  const titleCls = tone === "good" ? "text-emerald-200" : "text-red-200";

  return (
    <div className={`rounded-3xl border p-5 backdrop-blur ${toneCls}`}>
      <h4 className={`text-sm font-semibold ${titleCls}`}>{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/50" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

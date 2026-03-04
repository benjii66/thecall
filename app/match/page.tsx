import { NavbarWrapper } from "@/components/NavbarWrapper";
import { MatchSelector } from "@/components/MatchSelector";
import { MatchTypeFilter } from "@/components/MatchTypeFilter";
import { NexusBackground } from "@/components/NexusBackground";
import { BackgroundFX } from "@/components/BackgroundFX";
import { HorizontalTimeline } from "@/components/HorizontalTimeline";
import {
  MatchErrorMessages,
  MatchListHeader,
  MatchNotFoundMessage,
  MatchUnavailableMessage,
} from "@/components/MatchMessages";
import { SectionTitle } from "@/components/SectionTitle";
import { MatchHeader } from "@/components/MatchHeader";
import { MatchInfoBar } from "@/components/MatchInfoBar";
import { DuelSection } from "@/components/DuelSection";
import { TeamList } from "@/components/TeamList";
import { MatchBuildSection } from "@/components/MatchBuildSection";
import { WinProbabilityChart } from "@/components/WinProbabilityChart";
import { AnimatedSection, AnimatedItem } from "@/components/AnimatedSection";
import { TabContentWrapper } from "@/components/TabContentWrapper";
import { MatchList } from "@/components/MatchList";
import { MatchListSkeleton } from "@/components/SkeletonLoader";
import { MatchDetailTransitionWrapper } from "@/components/MatchDetailTransitionWrapper";
import { CoachTab } from "@/components/CoachTab";
import { MatchThemeController } from "@/components/MatchThemeController";
import { MatchListStats } from "@/components/MatchListStats";
import { GlassCard } from "@/components/GlassCard";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getMatchDetailsController,
  getMatchesListController,
} from "@/lib/controllers/matchController";
import type { GameType } from "@/types/gameType";
import { computeWinProbability } from "@/lib/winProbability";
import { validateMatchId } from "@/lib/security";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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
  const matchIdParam = sp.matchId;
  const activeTab = (sp.tab ?? "overview") as "overview" | "coach";

  // Valider le matchId si fourni
  const matchId = matchIdParam ? validateMatchId(matchIdParam) : null;

  // Resolution PUUID
  const cookieStore = await cookies();
  const cookiePuuid = cookieStore.get("user_puuid")?.value;

  const devPuuid =
    process.env.NODE_ENV === "development"
      ? process.env.MY_PUUID || process.env.NEXT_PUBLIC_PUUID
      : undefined;

  const puuid = cookiePuuid || devPuuid || "";

  if (!puuid) {
    redirect("/");
  }

  // Get match list (server-side)
  let matchesResult: { matches: any[]; error?: string };
  try {
    const res = await getMatchesListController(puuid, type);
    matchesResult = { matches: res.matches };
  } catch (err) {
    matchesResult = {
      matches: [],
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }

  const matches = matchesResult.matches ?? [];

  // ✅ Helper: même shell partout (landing vibe)
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="relative min-h-screen overflow-hidden text-white">
      <NexusBackground />
      <BackgroundFX />
      <div className="relative z-10">
        <NavbarWrapper />
        {children}
      </div>
    </main>
  );

  // Empty / Error state
  if (!matches.length) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <GlassCard className="p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <MatchErrorMessages error={matchesResult.error} />
          </GlassCard>
        </div>
      </Shell>
    );
  }

  // ✅ LIST VIEW (no matchId) -> NOW has BackgroundFX too
  if (!matchId) {
    return (
      <Shell>
        <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-32">
          <MatchListHeader />


          <GlassCard className="mb-6 flex flex-wrap items-center justify-between gap-4 p-2 shadow-sm">
            <Suspense
              fallback={
                <div
                  className="h-10 w-32 rounded-lg bg-white/10 animate-pulse"
                  aria-label="Chargement du filtre"
                />
              }
            >
              <MatchTypeFilter />
            </Suspense>
            <MatchListStats matches={matches} />
          </GlassCard>

          <Suspense fallback={<MatchListSkeleton count={5} />}>
            <MatchList matches={matches} />
          </Suspense>
        </section>
      </Shell>
    );
  }

  // ✅ Selected match
  const selectedMatchId =
    matchId && matches.some((m) => m.id === matchId)
      ? matchId
      : matchId
      ? matchId
      : matches[0]?.id;

  if (!selectedMatchId) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <GlassCard className="p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <MatchNotFoundMessage />
          </GlassCard>
        </div>
      </Shell>
    );
  }

  // Fetch match details
  let data: any = null;
  try {
    data = await getMatchDetailsController(selectedMatchId, puuid);
  } catch (err) {
    console.error("Error fetching match details:", err);
  }

  if (!data || !("me" in data)) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <GlassCard className="p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <MatchUnavailableMessage />
          </GlassCard>
        </div>
      </Shell>
    );
  }

  const finalMatchId = selectedMatchId;

  // Resolve User ID for quota/tier
  let userId: string | undefined = undefined;
  if (puuid) {
    try {
      const user = await import("@/lib/db/ensureUser").then(m => m.ensureUser({ riotPuuid: puuid }));
      userId = user.id;
    } catch (e) {
      console.warn("Failed to ensure user on page load", e);
    }
  }

  // Coaching & Tier Logic
  const { generateHeuristicReport } = await import("@/lib/coachingUtils");
  const { getUserTierServer, canDoCoachingServer } = await import("@/lib/tier-server");
  
  const coachingTier = getUserTierServer(userId);
  const coachingQuota = await canDoCoachingServer(userId);
  
  const winProbData = computeWinProbability(data.timelineEvents);
  const heuristicReport = generateHeuristicReport(data, winProbData, coachingTier === "pro");

  const auditPositive = heuristicReport.positives.map(p => p.description);
  const auditNegative = heuristicReport.negatives.map(n => n.description);
  const coachingReport = null; // Still fetch AI report client-side in CoachTab

  return (
    <Shell>
      <MatchDetailTransitionWrapper matchId={finalMatchId}>
        <MatchThemeController win={data.me.win} />

        <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-32">
          {/* HEADER HERO */}
{/* HEADER HERO */}
          <GlassCard className="relative z-[100] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)]">
            <div className="relative z-20 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <MatchHeader />

              <MatchInfoBar
                win={data.me.win}
                role={data.me.role}
                champion={data.me.champion}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <MatchTypeFilter />
                
                <Suspense
                  fallback={
                    <div
                      className="h-10 w-40 rounded-lg bg-white/10 animate-pulse"
                      aria-label="Chargement du sélecteur de match"
                    />
                  }
                >
                  <MatchSelector matches={matches} selected={finalMatchId} />
                </Suspense>
              </div>
            </div>
          </GlassCard>

          {/* TAB CONTENT */}
          <TabContentWrapper activeTab={activeTab}>
            {activeTab === "overview" && (
              <>
                {/* TIMELINE */}
                <AnimatedSection>
                  <section className="mt-10">
                    <SectionTitle
                      titleKey="match.timelineTitle"
                      subtitleKey="match.timelineSubtitle"
                    />
                    <GlassCard className="mt-4 p-8">
                      <HorizontalTimeline events={data.timelineEvents} />
                      <WinProbabilityChart
                        data={computeWinProbability(data.timelineEvents)}
                      />
                    </GlassCard>
                  </section>
                </AnimatedSection>

                {/* YOU vs OPPONENT */}
                <AnimatedSection>
                  <section className="mt-10">
                    <SectionTitle
                      titleKey="match.duelTitle"
                      subtitleKey="match.duelSubtitle"
                    />
                    <DuelSection me={data.me} opponent={data.opponent} />
                  </section>
                </AnimatedSection>

                {/* BUILDS */}
                <AnimatedSection>
                  <section className="mt-10">
                    <SectionTitle
                      titleKey="match.buildsTitle"
                      subtitleKey="match.buildsSubtitle"
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
                    <SectionTitle
                      titleKey="match.teamsTitle"
                      subtitleKey="match.teamsSubtitle"
                    />
                    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <AnimatedItem>
                        <TeamList
                          titleKey="match.yourTeam"
                          team={data.allyTeam}
                          tone="ally"
                        />
                      </AnimatedItem>
                      <AnimatedItem>
                        <TeamList
                          titleKey="match.enemyTeam"
                          team={data.enemyTeam}
                          tone="enemy"
                        />
                      </AnimatedItem>
                    </div>
                  </section>
                </AnimatedSection>
              </>
            )}

            {activeTab === "coach" && (
              <CoachTab
                matchId={finalMatchId}
                matchData={data}
                coachingReport={coachingReport}
                auditPositive={auditPositive}
                auditNegative={auditNegative}
                initialQuota={coachingQuota}
                initialTier={coachingTier}
              />
            )}
          </TabContentWrapper>
        </section>
      </MatchDetailTransitionWrapper>
    </Shell>
  );
}

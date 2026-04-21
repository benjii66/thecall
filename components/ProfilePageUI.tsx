"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ProfileInsightCard } from "@/components/ProfileInsightCard";
import { ProfileStats } from "@/components/ProfileStats";
import { ProfilePlaystyle } from "@/components/ProfilePlaystyle";
import { ProfileTrends } from "@/components/ProfileTrends";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ProfilePageTransition } from "@/components/ProfilePageTransition";
import { MiniProfile } from "@/components/MiniProfile";
import { hasMiniProfileAccess, hasFullProfileAccess } from "@/lib/tier";
import { useLanguage } from "@/lib/language";
import { PoroLoader } from "@/components/PoroLoader";

import type { PlayerProfile } from "@/types/profile";

type ProfileMeta = {
  quality: "premium" | "heuristic" | "heuristic_fallback";
  aiUsed: boolean;
  modelUsed?: string | null;
  cached: boolean;
  createdAt?: string;
};



export function ProfilePageUI({ puuid }: { puuid?: string }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<{ message: string; hint: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!puuid) {
         setLoading(false);
         return;
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev; // Slow down near the end
          return prev + (prev < 60 ? 12 : 3);
        });
      }, 500);

      try {
        const res = await fetch(`/api/profile?puuid=${puuid}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const json = (await res.json()) as { error?: string; hint?: string };
          setError({
            message: json.error || t("profile.unavailableDesc"),
            hint: json.hint || t("profile.puuidHint"),
          });
          setLoading(false);
          return;
        }

        const json = (await res.json()) as { 
            profile?: PlayerProfile; 
            meta?: ProfileMeta;
            needsSync?: boolean;
            source?: string;
        };

        if (json.needsSync) {
            // Trigger Sync
            const syncRes = await fetch("/api/sync/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ puuid })
            });
            
            if (syncRes.ok) {
                // Re-fetch profile
                const finalRes = await fetch(`/api/profile?puuid=${puuid}&refresh=true`, { cache: "no-store" });
                if (finalRes.ok) {
                    const finalJson = await finalRes.json();
                    setProfile(finalJson.profile ?? null);
                }
            } else {
                setError({
                    message: t("profile.unavailableDesc"),
                    hint: "La synchronisation a échoué. Réessaye plus tard."
                });
            }
        } else {
            setProfile(json.profile ?? null);
            if (!json.profile) {
              setError({
                message: t("profile.unavailableDesc"),
                hint: t("profile.puuidHint"),
              });
            }
        }
      } catch (err) {
        console.error("Profile load error:", err);
        setError({
          message: t("profile.unavailableDesc"),
          hint: t("profile.puuidHint"),
        });
      } finally {
        setProgress(100);
        setTimeout(() => {
            setLoading(false);
            clearInterval(progressInterval);
        }, 500);
      }
    }

    loadProfile();
  }, [t]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <PoroLoader progress={progress} />
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
          <p className="text-lg font-semibold">{t("profile.unavailable")}</p>
          <p className="mt-2 text-sm text-white/60">{error?.message || t("profile.unavailableDesc")}</p>
          <p className="mt-3 text-sm text-cyan-300">{error?.hint || t("profile.puuidHint")}</p>
          <Link
            href="/match"
            className="mt-4 inline-block rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {t("profile.goToMatches")}
          </Link>
        </div>
      </div>
    );
  }

  // Vérifier le tier pour déterminer si on affiche mini ou full
  const isMini = !hasFullProfileAccess() && hasMiniProfileAccess();

  return (
    <ProfilePageTransition>
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">

        {isMini ? (
          <MiniProfile profile={profile} />
        ) : (
          <>
            {/* HERO */}
            <AnimatedSection>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-md">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      {t("profile.title")}
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                      {t("profile.subtitle")}
                    </h1>
                    <p className="mt-2 text-sm text-white/60">
                      {t("profile.analysis", { games: String(profile.totalGames), winRate: String(profile.overallWinRate) })}
                      {profile.trends.improving ? (
                        <span className="ml-2 text-emerald-400">{t("profile.improving")}</span>
                      ) : (
                        <span className="ml-2 text-red-400">{t("profile.declining")}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md border border-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          {t("profile.mainRole")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-cyan-300">
                          {profile.mainRole}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md border border-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          {t("profile.winRate")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-300">
                          {profile.overallWinRate}%
                        </p>
                      </div>
                    </div>
                  
                    {/* META BADGES REMOVED */}
                  </div>
                </div>
              </div>
            </AnimatedSection>


            {/* TRENDS */}
            <div className="mt-10">
              <SectionTitle
                title={t("profile.trendsTitle") || "Evolution"}
                subtitle={t("profile.trendsSubtitle") || "Analyse de ta progression"}
              />
              <ProfileTrends history={profile?.history || []} />
            </div>

            {/* PLAYSTYLE */}
            <AnimatedSection>
              <section className="mt-10">
                <SectionTitle
                  title={t("profile.playstyleTitle")}
                  subtitle={t("profile.playstyleSubtitle")}
                />
                <div className="mt-4">
                  <ProfilePlaystyle playstyle={profile.playstyle} />
                </div>
              </section>
            </AnimatedSection>

            {/* INSIGHTS IA */}
            <section className="mt-10">
              <SectionTitle
                title={t("profile.insightsTitle")}
                subtitle={t("profile.insightsSubtitle")}
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profile.insights.map((insight, i) => (
                  <ProfileInsightCard key={i} insight={insight} />
                ))}
              </div>
            </section>

            {/* STATS PAR RÔLE */}
            <AnimatedSection>
              <section className="mt-10">
                <SectionTitle
                  title={t("profile.statsTitle")}
                  subtitle={t("profile.statsSubtitle")}
                />
                <div className="mt-4">
                  <ProfileStats roleStats={profile.roleStats} />
                </div>
              </section>
            </AnimatedSection>
          </>
        )}
      </section>
    </ProfilePageTransition>
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

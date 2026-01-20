"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ProfileInsightCard } from "@/components/ProfileInsightCard";
import { ProfileStats } from "@/components/ProfileStats";
import { ProfilePlaystyle } from "@/components/ProfilePlaystyle";
import { AnimatedSection, AnimatedItem } from "@/components/AnimatedSection";
import { ProfilePageTransition } from "@/components/ProfilePageTransition";
import { MiniProfile } from "@/components/MiniProfile";
import { hasMiniProfileAccess, hasFullProfileAccess } from "@/lib/tier";
import { useLanguage } from "@/lib/language";

import type { PlayerProfile } from "@/types/profile";

type ProfileMeta = {
  quality: "premium" | "heuristic" | "heuristic_fallback";
  aiUsed: boolean;
  modelUsed?: string | null;
  cached: boolean;
  createdAt?: string;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export function ProfilePageUI() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; hint: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${BASE_URL}/api/profile`, {
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

        const json = (await res.json()) as { profile?: PlayerProfile; meta?: ProfileMeta };
        setProfile(json.profile ?? null);
        setMeta(json.meta ?? null);
        if (!json.profile) {
          setError({
            message: t("profile.unavailableDesc"),
            hint: t("profile.puuidHint"),
          });
        }
      } catch {
        setError({
          message: t("profile.unavailableDesc"),
          hint: t("profile.puuidHint"),
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [t]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold">{t("common.loading")}</p>
        </div>
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
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          {t("profile.mainRole")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-cyan-300">
                          {profile.mainRole}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          {t("profile.winRate")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-300">
                          {profile.overallWinRate}%
                        </p>
                      </div>
                    </div>
                  
                    {/* META BADGES */}
                    {meta && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {meta.quality === "premium" && (
                           <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                             <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                             </span>
                             AI Analysis {meta.modelUsed ? `(${meta.modelUsed})` : ""}
                           </div>
                        )}
                        {(meta.quality === "heuristic" || meta.quality === "heuristic_fallback") && (
                           <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                             🧠 Standard
                           </div>
                        )}
                        {meta.cached && (
                           <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300">
                             ⚡ Cached
                           </div>
                        )}
                        {meta.createdAt && (
                           <div className="text-xs text-white/30">
                             {new Date(meta.createdAt).toLocaleDateString()}
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedSection>

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
            <AnimatedSection>
              <section className="mt-10">
                <SectionTitle
                  title={t("profile.insightsTitle")}
                  subtitle={t("profile.insightsSubtitle")}
                />
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {profile.insights.map((insight, i) => (
                    <AnimatedItem key={i}>
                      <ProfileInsightCard insight={insight} />
                    </AnimatedItem>
                  ))}
                </div>
              </section>
            </AnimatedSection>

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

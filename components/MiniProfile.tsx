"use client";

import { useState, useEffect } from "react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { ConversionBanner } from "./ConversionBanner";
import { PaywallSection } from "./PaywallSection";
import { ProfilePlaystyle } from "./ProfilePlaystyle";
import { ProfileInsightCard } from "./ProfileInsightCard";
import { ProfileStats } from "./ProfileStats";
import type { PlayerProfile } from "@/types/profile";
import { TrendingUp, BarChart3, Target, FileText } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface MiniProfileProps {
  profile: PlayerProfile;
}

export function MiniProfile({ profile }: MiniProfileProps) {
  const { t } = useLanguage();
  const [isMini, setIsMini] = useState(true);

  useEffect(() => {
    // Récupérer le tier depuis l'API (pour avoir accès à DEV_TIER côté serveur)
    fetch("/api/tier")
      .then((res) => res.json())
      .then((data: { tier?: "free" | "pro" }) => {
        const currentTier = data.tier || "free";
        setIsMini(currentTier === "free");
      })
      .catch(() => {
        // Fallback si l'API échoue - par défaut on considère comme free
        setIsMini(true);
      });
  }, []);

  // Limiter à 5-10 matchs pour mini-profil
  const limitedProfile: PlayerProfile = isMini
    ? {
        ...profile,
        totalGames: Math.min(profile.totalGames, 10),
        roleStats: profile.roleStats.slice(0, 1), // Un seul rôle
        insights: profile.insights.slice(0, 1), // Un seul insight headline
      }
    : profile;

  return (
    <>
      <AnimatedSection>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                {t("profile.title")} {isMini && "(Mini)"}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                {t("profile.subtitle")}
              </h1>
              <p className="mt-2 text-sm text-white/60">
                {t("profile.analysis", { games: String(limitedProfile.totalGames), winRate: String(limitedProfile.overallWinRate) })}
                {limitedProfile.trends.improving ? (
                  <span className="ml-2 text-emerald-400">{t("profile.improving")}</span>
                ) : (
                  <span className="ml-2 text-red-400">{t("profile.declining")}</span>
                )}
              </p>
            </div>

            <div className="flex gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {t("profile.mainRole")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-cyan-300">
                  {limitedProfile.mainRole}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {t("profile.winRate")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">
                  {limitedProfile.overallWinRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Banner conversion */}
      {isMini && (
        <ConversionBanner variant="mini-profile" />
      )}

      {/* PLAYSTYLE (2-3 traits) */}
      <AnimatedSection>
        <section className="mt-10">
          <SectionTitle
            title={t("profile.playstyleTitle")}
            subtitle={t("profile.playstyleSubtitle")}
          />
          <div className="mt-4">
            <ProfilePlaystyle playstyle={limitedProfile.playstyle} />
          </div>
        </section>
      </AnimatedSection>

      {/* INSIGHT HEADLINE (1 seul en free) */}
      {limitedProfile.insights.length > 0 && (
        <AnimatedSection>
          <section className="mt-10">
            <SectionTitle
              title={t("profile.insightsTitle")}
              subtitle={isMini ? t("profile.insightsSubtitle") + " (1 insight)" : t("profile.insightsSubtitle")}
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {limitedProfile.insights.map((insight, i) => (
                <AnimatedItem key={i}>
                  <ProfileInsightCard insight={insight} />
                </AnimatedItem>
              ))}
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* Sections premium verrouillées (si mini) */}
      {isMini && (
        <div className="mt-10 space-y-6">
          <SectionTitle
            title="Profil complet Pro"
            subtitle="Débloquer avec upgrade Pro"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <PaywallSection
              title="Insights détaillés"
              description="Analyse approfondie avec patterns récurrents et axes d'amélioration personnalisés"
              icon={BarChart3}
              price="3.99€/mois"
            />
            <PaywallSection
              title="Patterns récurrents"
              description="Détection d'erreurs fréquentes sur 50+ matchs avec recommandations ciblées"
              icon={Target}
              price="3.99€/mois"
            />
            <PaywallSection
              title="Plan d'amélioration"
              description="Plan d'action personnalisé avec priorités early/mid/late game"
              icon={TrendingUp}
              price="3.99€/mois"
            />
            <PaywallSection
              title="Rapport mensuel"
              description="3 sous-scores (tempo/objectifs, économie, sécurité) + évolution 30 jours"
              icon={FileText}
              price="3.99€/mois"
            />
          </div>
        </div>
      )}

      {/* STATS PAR RÔLE (complet si pro, limité si mini) */}
      {!isMini && (
        <AnimatedSection>
          <section className="mt-10">
            <SectionTitle
              title={t("profile.statsTitle")}
              subtitle={t("profile.statsSubtitle")}
            />
            <div className="mt-4">
              <ProfileStats roleStats={limitedProfile.roleStats} />
            </div>
          </section>
        </AnimatedSection>
      )}
    </>
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


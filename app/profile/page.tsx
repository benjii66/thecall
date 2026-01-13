// app/profile/page.tsx
import Link from "next/link";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { ProfileInsightCard } from "@/components/ProfileInsightCard";
import { ProfileStats } from "@/components/ProfileStats";
import { ProfilePlaystyle } from "@/components/ProfilePlaystyle";
import { AnimatedSection, AnimatedItem } from "@/components/AnimatedSection";
import { ProfilePageTransition } from "@/components/ProfilePageTransition";
import { MiniProfile } from "@/components/MiniProfile";
import { getUserTier, hasMiniProfileAccess, hasFullProfileAccess } from "@/lib/tier";

import type { PlayerProfile } from "@/types/profile";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

async function getProfile(): Promise<PlayerProfile | null> {
  const puuid =
    process.env.MY_PUUID ??
    process.env.NEXT_PUBLIC_PUUID ??
    process.env.PUUID ??
    "";

  if (!puuid) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/profile?puuid=${encodeURIComponent(puuid)}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as { profile?: PlayerProfile };
    return json.profile ?? null;
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    // Vérifier si c'est une erreur de cache
    let errorMessage = "Impossible de charger ton profil.";
    let hint = "Vérifie que MY_PUUID est défini dans .env.local.";
    
    try {
      const res = await fetch(`${BASE_URL}/api/profile?puuid=${encodeURIComponent(
        process.env.MY_PUUID ?? process.env.NEXT_PUBLIC_PUUID ?? process.env.PUUID ?? ""
      )}`, { cache: "no-store" });
      const json = (await res.json()) as { error?: string; hint?: string };
      if (json.error) errorMessage = json.error;
      if (json.hint) hint = json.hint;
    } catch {
      // Ignore
    }

    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <NavbarWrapper />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <p className="text-lg font-semibold">Profil indisponible</p>
            <p className="mt-2 text-sm text-white/60">{errorMessage}</p>
            <p className="mt-3 text-sm text-cyan-300">{hint}</p>
            <Link
              href="/match"
              className="mt-4 inline-block rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Aller sur /match pour charger tes matchs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Vérifier le tier pour déterminer si on affiche mini ou full
  const isMini = !hasFullProfileAccess() && hasMiniProfileAccess();

  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />

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
                        The Call • Profil joueur Pro
                      </p>
                      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                        Ton profil de jeu
                      </h1>
                      <p className="mt-2 text-sm text-white/60">
                        Analyse de {profile.totalGames} parties • Win rate {profile.overallWinRate}%
                        {profile.trends.improving ? (
                          <span className="ml-2 text-emerald-400">↑ En progression</span>
                        ) : (
                          <span className="ml-2 text-red-400">↓ À améliorer</span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          Rôle principal
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-cyan-300">
                          {profile.mainRole}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          Win rate
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-300">
                          {profile.overallWinRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* PLAYSTYLE */}
              <AnimatedSection>
                <section className="mt-10">
                  <SectionTitle
                    title="Ton style de jeu"
                    subtitle="Analyse de tes patterns de jeu"
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
                    title="Insights TheCall"
                    subtitle="Analyse personnalisée de ton gameplay"
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
                    title="Stats par rôle"
                    subtitle="Performance détaillée sur chaque position"
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
    </main>
  );
}

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

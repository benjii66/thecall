"use client";

import {
  ArrowRight,
  ShieldCheck,
  Goal,
  Sparkles,
  Target,
} from "lucide-react";
import { RiotIdForm } from "@/components/RiotIdForm";
import { NavigationButton } from "@/components/NavigationButton";
import { useLanguage } from "@/lib/language";
import { GlassCard } from "@/components/GlassCard";
import { HoloTypography } from "@/components/HoloTypography";

export function LandingPageUI() {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t("landing.feature1Title"),
      desc: t("landing.feature1Desc"),
      icon: ShieldCheck,
      proof: t("landing.feature1Proof"),
    },
    {
      title: t("landing.feature2Title"),
      desc: t("landing.feature2Desc"),
      icon: Target,
      proof: t("landing.feature2Proof"),
    },
    {
      title: t("landing.feature3Title"),
      desc: t("landing.feature3Desc"),
      icon: Goal,
      proof: t("landing.feature3Proof"),
    },
  ];

  const coachBlocks = [
    t("landing.coachingExample1"),
    t("landing.coachingExample2"),
  ];

  return (
    <>
      <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pt-36 pb-16">
        {/* BETA BADGE */}
        <div className="flex items-center justify-center gap-3 text-xs text-white/60">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-medium text-cyan-300">
            {t("landing.beta")}
          </span>
          <span className="text-white/50">•</span>
          <span>{t("landing.focus")}</span>
          <span className="text-white/50">•</span>
          <span>{t("landing.postGame")}</span>
        </div>

        {/* HERO */}
        <GlassCard className="p-8 lg:pt-12 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] lg:flex lg:items-start lg:justify-between lg:gap-10">
             {/* Ambient Glow */}
             <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px] opacity-40 mix-blend-screen" />
             
          <div className="relative flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
              {t("landing.tagline")}
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight leading-[1.05] lg:text-5xl text-white">
              {t("landing.title")}
              <br />
              <HoloTypography variant="highlight" className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200">
                {t("landing.titleHighlight")}
              </HoloTypography> {t("landing.titleEnd")}
            </h1>

            <p className="mt-2 text-sm text-white/55">
              <span className="font-semibold text-white/75">{t("landing.titleHighlight")}</span> — {t("landing.subtitle")}
            </p>

            <p className="mt-4 max-w-3xl text-base text-white/70">
              {t("landing.description")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <NavigationButton href="/match" variant="primary" className="w-full sm:w-auto">
                {t("landing.analyzeButton")}
                <ArrowRight className="h-4 w-4" />
              </NavigationButton>

              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm font-semibold text-white/50 opacity-55 shadow-lg shadow-black/40 w-full sm:w-auto"
                title={t("landing.riotConnectTitle")}
              >
                {t("landing.riotConnect")}
              </button>
            </div>

            <RiotIdForm />

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/70">
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-cyan-300" />
                {t("landing.fastReport")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t("landing.roleAdapted")}
              </span>
            </div>

            <p className="mt-2 text-xs text-white/45">
              {t("landing.taglineShort")}
            </p>

            <p className="mt-3 text-xs text-white/45">
              {t("landing.targetAudience")}
            </p>
          </div>

          {/* Hero preview card */}
          <div className="hidden flex-1 justify-end lg:flex lg:-mt-40 lg:translate-y-[-35%]">
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold text-white/80">
                  {t("landing.previewWinProb")}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] text-emerald-300">
                  {t("landing.previewWinProbValue")}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-white/55">
                {t("landing.previewKeyMoment")} <span className="font-semibold">15:15</span> —
                {t("landing.previewHerald")}{" "}
                <span className="text-rose-300">(-18% win)</span>
              </p>

              <div className="relative h-20 w-full overflow-hidden rounded-lg bg-linear-to-b from-white/5 via-black/60 to-black">
                <svg
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  {/* grid */}
                  <defs>
                    <linearGradient id="heroProbLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="heroProbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.25)" />
                      <stop offset="50%" stopColor="rgba(139,92,246,0.15)" />
                      <stop offset="100%" stopColor="rgba(239,68,68,0.25)" />
                    </linearGradient>
                    <filter id="heroGlow">
                      <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* 50% baseline */}
                  <line
                    x1="0"
                    x2="100"
                    y1="20"
                    y2="20"
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 4"
                    strokeWidth="0.5"
                  />

                  {/* Area fill */}
                  <path
                    d="M 0 20 L 0 40 L 100 40 L 100 5 C 95 8 90 12 80 15 C 70 18 60 22 50 20 C 40 18 35 25 25 28 C 15 30 10 25 0 20 Z"
                    fill="url(#heroProbAreaGrad)"
                    opacity="0.6"
                  />

                  {/* Main Curve */}
                  <path
                    d="M 0 20 C 10 25 15 30 25 28 C 35 25 40 18 50 20 C 60 22 70 18 80 15 C 90 12 95 8 100 5"
                    fill="none"
                    stroke="url(#heroProbLineGrad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#heroGlow)"
                  />
                  {/* Win End */}
                  <g transform="translate(100, 5)">
                     <circle r="1.5" fill="#06b6d4" />
                     <circle r="4" fill="rgba(6,182,212,0.2)" className="animate-pulse" />
                  </g>


                </svg>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-white/70">
                {/* MACRO */}
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 flex flex-col justify-between">
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-300">
                    {t("landing.previewMacro")}
                  </div>
                  <div className="mt-1.5 text-[10px] leading-snug text-white/80">
                    Rotation dragon parfaite. Bon usage du tempo mid-game.
                  </div>
                </div>

                {/* LANING */}
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 flex flex-col justify-between">
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-300">
                    {t("landing.previewLaning")}
                  </div>
                  <div className="mt-1.5 text-[10px] leading-snug text-white/80">
                    Dominant (+15cs). Attention aux ganks topside vers 4:00.
                  </div>
                </div>

                {/* DECISIONS */}
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 flex flex-col justify-between">
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-rose-300">
                    {t("landing.previewDecisions")}
                  </div>
                  <div className="mt-1.5 text-[10px] leading-snug text-white/80">
                    2 morts évitables en sidelane. Respecte le fog of war.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* EXEMPLE DE RAPPORT */}
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {t("landing.exampleTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                {t("landing.exampleKeyMoment")}
              </div>
              <p className="text-sm text-white/90">
                {t("landing.exampleKeyMomentText")}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {t("landing.exampleKeyMomentConsequence")}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                {t("landing.exampleRootCause")}
              </div>
              <p className="text-sm text-white/90">
                {t("landing.exampleRootCauseText")}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {t("landing.exampleRootCauseDetail")}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                {t("landing.exampleAction")}
              </div>
              <p className="text-sm text-white/90">
                {t("landing.exampleActionText")}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {t("landing.exampleActionDetail")}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* HOW IT WORKS (3 actions concrètes) */}
        <div className="mt-6 grid gap-3 text-xs text-white/70 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-semibold text-cyan-300">
              1
            </span>
            <p>{t("landing.howItWorks1")}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-semibold text-cyan-300">
              2
            </span>
            <p>{t("landing.howItWorks2")}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-semibold text-cyan-300">
              3
            </span>
            <p>{t("landing.howItWorks3")}</p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ title, desc, icon: Icon, proof }) => (
            <GlassCard
              key={title}
              className="p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                <Icon size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white/90">{title}</h3>
              <p className="mt-2 text-sm text-white/60">{desc}</p>
              {proof && (
                <p className="mt-3 text-[11px] font-medium uppercase tracking-widest text-white/40">
                  {proof}
                </p>
              )}
            </GlassCard>
          ))}
        </div>

        {/* WHAT YOU GET AFTER A GAME */}
        <GlassCard className="grid gap-6 p-6 md:grid-cols-[1.6fr_1.1fr] bg-linear-to-br from-white/5 via-transparent to-cyan-500/5">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Sparkles className="h-5 w-5 text-cyan-300" />{t("landing.coachingTitle")}
            </h2>
            <p className="mt-3 text-sm text-white/70">
              {t("landing.coachingSubtitle")}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-black/40 p-4 text-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Target className="h-4 w-4" />
              {t("landing.coachingExample")}
            </div>
            <ul className="space-y-2 text-white/70">
              {coachBlocks.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
      </section>
    </>
  );
}

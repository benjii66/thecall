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
import { BackgroundFX } from "@/components/BackgroundFX";

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
      {/* BACKGROUND LAYER (vibe client LoL) */}
      <BackgroundFX />

      <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
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
        <div className="rounded-3xl border border-white/10 bg-white/4 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-md lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
              {t("landing.tagline")}
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight leading-[1.05] lg:text-5xl">
              {t("landing.title")}
              <br />
              <span className="text-white">{t("landing.titleHighlight")}</span> {t("landing.titleEnd")}
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
          <div className="mt-8 hidden flex-1 justify-end lg:flex">
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
                    <pattern
                      id="heroGrid"
                      x="0"
                      y="0"
                      width="4"
                      height="4"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 4 0 L 0 0 0 4"
                        fill="none"
                        stroke="rgba(148,163,184,0.28)"
                        strokeWidth="0.2"
                      />
                    </pattern>
                    <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
                      <stop offset="50%" stopColor="rgba(148,163,184,0.18)" />
                      <stop offset="100%" stopColor="rgba(248,113,113,0.3)" />
                    </linearGradient>
                    <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="40%" stopColor="#22c55e" />
                      <stop offset="75%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#f97373" />
                    </linearGradient>
                  </defs>

                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="40"
                    fill="url(#heroGrid)"
                    opacity="0.2"
                  />

                  {/* top / bottom zones */}
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="20"
                    fill="rgba(34,197,94,0.12)"
                  />
                  <rect
                    x="0"
                    y="20"
                    width="100"
                    height="20"
                    fill="rgba(248,113,113,0.12)"
                  />

                  {/* baseline 50% */}
                  <line
                    x1="0"
                    x2="100"
                    y1="20"
                    y2="20"
                    stroke="rgba(248,250,252,0.3)"
                    strokeDasharray="3 3"
                    strokeWidth="0.5"
                  />

                  {/* sample curve area */}
                  <path
                    d="M 0 23 C 10 24 18 26 26 22 C 35 18 42 14 50 18 C 58 22 64 30 72 28 C 82 25 88 18 100 19 L 100 40 L 0 40 Z"
                    fill="url(#heroArea)"
                    opacity="0.9"
                  />

                  {/* sample curve line */}
                  <path
                    d="M 0 23 C 10 24 18 26 26 22 C 35 18 42 14 50 18 C 58 22 64 30 72 28 C 82 25 88 18 100 19"
                    fill="none"
                    stroke="url(#heroLine)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  {/* sample event markers */}
                  <g>
                    {/* Kill */}
                    <line
                      x1="18"
                      y1="24"
                      x2="18"
                      y2="32"
                      stroke="rgba(248,250,252,0.45)"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx="18" cy="24" r="1.3" fill="#22c55e">
                      <title>Kill — +6% win prob</title>
                    </circle>
                    <text
                      x="18"
                      y="36"
                      textAnchor="middle"
                      fontSize="4"
                      fill="rgba(248,250,252,0.75)"
                    >
                      Kill
                    </text>

                    {/* Herald */}
                    <line
                      x1="50"
                      y1="18"
                      x2="50"
                      y2="30"
                      stroke="rgba(248,250,252,0.45)"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx="50" cy="18" r="1.3" fill="#22c55e">
                      <title>Herald perdu — -18% win prob</title>
                    </circle>
                    <text
                      x="50"
                      y="34"
                      textAnchor="middle"
                      fontSize="4"
                      fill="rgba(248,250,252,0.75)"
                    >
                      Herald
                    </text>

                    {/* Baron */}
                    <line
                      x1="82"
                      y1="21"
                      x2="82"
                      y2="31"
                      stroke="rgba(248,250,252,0.45)"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx="82" cy="21" r="1.3" fill="#f97316">
                      <title>Baron — swing décisif</title>
                    </circle>
                    <text
                      x="82"
                      y="35"
                      textAnchor="middle"
                      fontSize="4"
                      fill="rgba(248,250,252,0.75)"
                    >
                      Baron
                    </text>
                  </g>
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-white/70">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {t("landing.previewMacro")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {t("landing.previewMacroScore")}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/55">
                    {t("landing.previewMacroValue")}
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-cyan-400" />
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {t("landing.previewLaning")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {t("landing.previewLaningScore")}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/55">
                    {t("landing.previewLaningValue")}
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                    <div className="h-full w-[64%] rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {t("landing.previewDecisions")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {t("landing.previewDecisionsScore")}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/55">
                    {t("landing.previewDecisionsValue")}
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                    <div className="h-full w-[42%] rounded-full bg-rose-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EXEMPLE DE RAPPORT */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
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
        </div>

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
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/3 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
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
            </div>
          ))}
        </div>

        {/* WHAT YOU GET AFTER A GAME */}
        <div className="grid gap-6 rounded-2xl border border-white/10 bg-linear-to-br from-white/5 via-transparent to-cyan-500/5 p-6 md:grid-cols-[1.6fr_1.1fr]">
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
        </div>
      </section>
    </>
  );
}

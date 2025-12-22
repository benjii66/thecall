// app/page.tsx
import { Navbar } from "@/components/Navbar";
import { MatchSelector } from "@/components/MatchSelector";
import { MatchTypeFilter } from "@/components/MatchTypeFilter";
import { HorizontalTimeline } from "@/components/HorizontalTimeline";
import { MatchBuildSection } from "@/components/MatchBuildSection";

import Image from "next/image";
import type { MatchPageData, TeamPlayer } from "@/types/match";
import type { MatchListItem } from "@/types/matchList";

/* ----------------------------------
   DATA DRAGON
---------------------------------- */

const DD_VERSION = "14.18.1";

const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${name}.png`;

const champSplash = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`;

/* ----------------------------------
   SERVER FETCH
---------------------------------- */

async function getMatches(
  type: "all" | "draft" | "ranked"
): Promise<MatchListItem[]> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/matches?puuid=${process.env.MY_PUUID}&type=${type}`,
      { cache: "no-store" }
    );

    if (!res.ok) return [];
    const data = (await res.json()) as MatchListItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getMatch(id: string): Promise<MatchPageData | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/match/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as MatchPageData;
  } catch {
    return null;
  }
}

/* ----------------------------------
   PAGE
---------------------------------- */

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    matchId?: string;
    type?: "all" | "draft" | "ranked";
  }>;
}) {
  const { matchId, type = "all" } = await searchParams;

  const matches = await getMatches(type);

  if (!matches.length) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <Navbar />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <p className="text-lg font-semibold">Aucun match disponible</p>
            <p className="mt-2 text-sm text-white/60">
              Impossible de récupérer la liste des matchs.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Match sélectionné (si présent dans la liste), sinon premier match
  const selectedMatchId =
    matchId && matches.some((m) => m.id === matchId) ? matchId : matches[0].id;

  // On tente d'abord le match sélectionné, puis les autres (anti match mort)
  const orderedMatches: MatchListItem[] =
    selectedMatchId && matches.some((m) => m.id === selectedMatchId)
      ? [
          matches.find((m) => m.id === selectedMatchId)!,
          ...matches.filter((m) => m.id !== selectedMatchId),
        ]
      : matches;

  let data: MatchPageData | null = null;
  let finalMatchId: string | null = null;

  for (const m of orderedMatches) {
    const result = await getMatch(m.id);
    if (result) {
      data = result;
      finalMatchId = m.id;
      break;
    }
  }

  if (!data || !finalMatchId) {
    return (
      <main className="min-h-screen bg-[#05060b] text-white">
        <Navbar />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]">
            <p className="text-lg font-semibold">Match indisponible</p>
            <p className="mt-2 text-sm text-white/60">
              Aucun match accessible via l’API Riot pour le moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // (Optionnel) Prépare des placeholders pour ton futur audit IA
  const auditPositive = [
    "Bon tempo early (objectifs sécurisés)",
    "Bonne présence en fights",
    "Build cohérent avec ton rôle",
  ];
  const auditNegative = [
    "KP perfectible sur mid game",
    "Trop de gold non converti en tempo",
    "Vision à optimiser avant objectifs",
  ];

  return (
    <main className="min-h-screen text-white bg-[#05060b]">
      <Navbar />

      {/* BACKGROUND LAYER (client LoL vibes) */}
      <BackgroundFX />

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
                <MatchSelector matches={matches} selected={finalMatchId} />
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

        {/* TIMELINE */}
        <section className="mt-10">
          <SectionTitle title="Timeline" subtitle="Objectifs & events clés" />
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <HorizontalTimeline events={data.timelineEvents} />
          </div>
        </section>

        {/* YOU vs OPPONENT */}
        <section className="mt-10">
          <SectionTitle
            title="Duel"
            subtitle="Focus principal : toi vs vis-à-vis"
          />

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
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
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/60">
                Impossible d’identifier un vis-à-vis (role match).
              </div>
            )}
          </div>
        </section>

        {/* BUILDS */}
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

        {/* TEAMS */}
        <section className="mt-10">
          <SectionTitle title="Teams" subtitle="Lisible, compact, efficace" />
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TeamList title="Your Team" team={data.allyTeam} tone="ally" />
            <TeamList title="Enemy Team" team={data.enemyTeam} tone="enemy" />
          </div>
        </section>

        {/* AUDIT IA */}
        <section className="mt-10">
          <SectionTitle
            title="Audit IA"
            subtitle="Deux blocs : positif vs négatif (on branchera le vrai modèle après)"
          />

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AuditCard title="Points forts" tone="good" items={auditPositive} />
            <AuditCard
              title="Points à améliorer"
              tone="bad"
              items={auditNegative}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

/* ----------------------------------
   UI PARTS
---------------------------------- */

function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      {/* noise (via globals.css .noise) */}
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
      {/* splash */}
      <Image
        src={champSplash(champion)}
        alt=""
        fill
        className="object-cover opacity-[0.12]"
        priority
      />
      {/* overlay gradients */}
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

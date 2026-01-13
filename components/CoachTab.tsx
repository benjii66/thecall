"use client";

import { useState, useEffect } from "react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { CoachingQuotaBadge } from "./CoachingQuotaBadge";
import { PaywallSections } from "./PaywallSection";
import { ConversionBanner } from "./ConversionBanner";
import type { CoachingReport } from "@/types/coaching";
import { getUserTier, canDoCoaching } from "@/lib/tier";

interface CoachTabProps {
  coachingReport: CoachingReport | null;
  matchData: unknown; // MatchPageData
  auditPositive: string[];
  auditNegative: string[];
  initialQuota?: { remaining: number; limit: number } | null;
  initialTier?: "free" | "pro";
}

export function CoachTab({
  coachingReport,
  matchData,
  auditPositive,
  auditNegative,
  initialQuota,
  initialTier,
}: CoachTabProps) {
  const [tier, setTier] = useState<"free" | "pro">(initialTier || "free");
  const [quota, setQuota] = useState<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }>(() => {
    if (initialQuota) {
      return {
        allowed: initialQuota.remaining > 0,
        remaining: initialQuota.remaining,
        limit: initialQuota.limit,
      };
    }
    return { allowed: true, remaining: 5, limit: 5 };
  });
  const [showFirstBanner, setShowFirstBanner] = useState(false);

  useEffect(() => {
    // Récupérer le tier depuis l'API (pour avoir accès à DEV_TIER côté serveur)
    fetch("/api/tier")
      .then((res) => res.json())
      .then((data: { tier?: "free" | "pro" }) => {
        const currentTier = data.tier || "free";
        setTier(currentTier);

        // Vérifier le quota si pas déjà fourni
        if (!initialQuota) {
          canDoCoaching().then((q) => {
            setQuota(q);
            // Afficher banner après le 1er coaching si free tier
            if (currentTier === "free" && q.remaining < q.limit) {
              setShowFirstBanner(true);
            }
          });
        } else {
          // Afficher banner si free tier et quota utilisé
          if (currentTier === "free" && initialQuota.remaining < initialQuota.limit) {
            setShowFirstBanner(true);
          }
        }
      })
      .catch(() => {
        // Fallback si l'API échoue
        const currentTier = getUserTier();
        setTier(currentTier);
      });
  }, [initialQuota]);

  const isPro = tier === "pro";
  const hasQuota = quota.allowed || isPro; // Pro = toujours autorisé

  return (
    <AnimatedSection>
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Coaching TheCall
            </h2>
            <p className="mt-1 text-sm text-white/55">
              Analyse post-match avec insights personnalisés
            </p>
          </div>
        </div>

        {/* Quota badge */}
        <CoachingQuotaBadge
          remaining={quota.remaining}
          limit={quota.limit}
          tier={tier}
        />

        {/* Conversion banners - uniquement pour free tier */}
        {!isPro && showFirstBanner && (
          <ConversionBanner
            variant="first-coaching"
            onDismiss={() => setShowFirstBanner(false)}
          />
        )}
        {!isPro && !hasQuota && (
          <ConversionBanner variant="quota-exhausted" />
        )}

        {/* Coaching basique (gratuit) - toujours visible si coachingReport existe */}
        {coachingReport && hasQuota && (
          <div className="mt-4 space-y-6">
            {/* Turning Point, Focus, Action - ACCESSIBLE GRATUITEMENT */}
            {(coachingReport.turningPoint ||
              coachingReport.focus ||
              coachingReport.action) && (
              <div className="grid gap-4 md:grid-cols-3">
                {coachingReport.turningPoint && (
                  <AnimatedItem>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                        {coachingReport.turningPoint.title}
                      </div>
                      <p className="text-sm text-white/90">
                        {coachingReport.turningPoint.timestamp && (
                          <span className="font-semibold">
                            {coachingReport.turningPoint.timestamp}
                          </span>
                        )}{" "}
                        — {coachingReport.turningPoint.description}
                      </p>
                      {coachingReport.turningPoint.impact && (
                        <p className="mt-1 text-xs text-white/60">
                          Impact: {coachingReport.turningPoint.impact}
                        </p>
                      )}
                    </div>
                  </AnimatedItem>
                )}
                {coachingReport.focus && (
                  <AnimatedItem>
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-purple-300">
                        {coachingReport.focus.title}
                      </div>
                      <p className="text-sm text-white/90">
                        {coachingReport.focus.description}
                      </p>
                    </div>
                  </AnimatedItem>
                )}
                {coachingReport.action && (
                  <AnimatedItem>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                        {coachingReport.action.title}
                      </div>
                      <p className="text-sm text-white/90">
                        {coachingReport.action.description}
                      </p>
                    </div>
                  </AnimatedItem>
                )}
              </div>
            )}

            {/* Objectifs de progression - ACCESSIBLE GRATUITEMENT (basique) */}
            {auditNegative.length > 0 && (
              <AnimatedItem>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Objectifs de progression
                  </h3>
                  <ul className="space-y-3">
                    {auditNegative.slice(0, isPro ? auditNegative.length : 3).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                      >
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300">
                          {i + 1}
                        </div>
                        <p className="flex-1 text-sm text-white/90">{item}</p>
                      </li>
                    ))}
                  </ul>
                  {!isPro && auditNegative.length > 3 && (
                    <p className="mt-3 text-xs text-white/50 italic">
                      +{auditNegative.length - 3} autres objectifs disponibles avec Pro
                    </p>
                  )}
                </div>
              </AnimatedItem>
            )}

            {/* Positives & Negatives - ACCESSIBLE GRATUITEMENT (basique) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnimatedItem>
                <AuditCard 
                  title="Points forts" 
                  tone="good" 
                  items={isPro ? auditPositive : auditPositive.slice(0, 3)} 
                />
                {!isPro && auditPositive.length > 3 && (
                  <p className="mt-2 text-xs text-white/50 italic text-center">
                    +{auditPositive.length - 3} autres points forts avec Pro
                  </p>
                )}
              </AnimatedItem>
              <AnimatedItem>
                <AuditCard
                  title="Points à améliorer"
                  tone="bad"
                  items={isPro ? auditNegative : auditNegative.slice(0, 3)}
                />
                {!isPro && auditNegative.length > 3 && (
                  <p className="mt-2 text-xs text-white/50 italic text-center">
                    +{auditNegative.length - 3} autres points à améliorer avec Pro
                  </p>
                )}
              </AnimatedItem>
            </div>
          </div>
        )}

        {/* Sections premium (UNIQUEMENT pour tier Pro) */}
        {isPro && coachingReport && (coachingReport.rootCauses || coachingReport.actionPlan || coachingReport.drills) && (
          <div className="mt-6 space-y-6">
            {/* Causes racines */}
            {coachingReport.rootCauses && (
              <AnimatedItem>
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">
                    {coachingReport.rootCauses.title}
                  </h3>
                  <div className="space-y-4">
                    {coachingReport.rootCauses.causes.map((cause, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-sm font-semibold text-white/90">
                            {cause.cause}
                          </span>
                          {cause.timing && (
                            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                              {cause.timing}
                            </span>
                          )}
                        </div>
                        <ul className="mt-2 space-y-1">
                          {cause.evidence.map((ev, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedItem>
            )}

            {/* Plan d'action */}
            {coachingReport.actionPlan && (
              <AnimatedItem>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    {coachingReport.actionPlan.title}
                  </h3>
                  <div className="space-y-4">
                    {coachingReport.actionPlan.rules.map((rule, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-sm font-semibold text-white/90">
                            {rule.rule}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              rule.phase === "early"
                                ? "bg-green-500/20 text-green-300"
                                : rule.phase === "mid"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {rule.phase}
                          </span>
                        </div>
                        {rule.antiErrors.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 text-xs font-medium text-white/50">
                              Erreurs à éviter :
                            </p>
                            <ul className="space-y-1">
                              {rule.antiErrors.map((error, j) => (
                                <li
                                  key={j}
                                  className="flex items-start gap-2 text-sm text-white/70"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                                  <span>{error}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedItem>
            )}

            {/* Drills / exercices */}
            {coachingReport.drills && (
              <AnimatedItem>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    {coachingReport.drills.title}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {coachingReport.drills.exercises.map((exercise, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-white/90">
                            {exercise.exercise}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                            {exercise.games} games
                          </span>
                        </div>
                        <p className="text-sm text-white/70">{exercise.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedItem>
            )}
          </div>
        )}

        {/* Paywall sections premium (toujours visibles en free pour montrer la valeur) */}
        {!isPro && (
          <PaywallSections />
        )}

        {/* Message si pas de coaching report et pas de quota */}
        {!coachingReport && !hasQuota && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-semibold text-white/90">
              Quota coaching épuisé
            </p>
            <p className="mt-2 text-sm text-white/60">
              Upgrade Pro pour coaching illimité + profil complet
            </p>
          </div>
        )}
      </section>
    </AnimatedSection>
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


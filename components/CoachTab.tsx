"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { CoachingQuotaBadge } from "./CoachingQuotaBadge";
import { PaywallSections } from "./PaywallSection";
import { ConversionBanner } from "./ConversionBanner";
import type { CoachingReport } from "@/types/coaching";
import { getUserTier, canDoCoaching } from "@/lib/tier";
import { useLanguage } from "@/lib/language";

interface CoachTabProps {
  matchId: string;
  coachingReport: CoachingReport | null;
  auditPositive: string[];
  auditNegative: string[];
  initialQuota?: { remaining: number; limit: number } | null;
  initialTier?: "free" | "pro";
}

export function CoachTab({
  matchId,
  coachingReport: initialReport,
  auditPositive,
  auditNegative,
  initialQuota,
  initialTier,
}: CoachTabProps) {
  const [report, setReport] = useState<CoachingReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const { t } = useLanguage();

  const hasFetched = useRef(false);

  useEffect(() => {
    // Si pas de rapport initial, on le charge
    if (!initialReport && matchId && !hasFetched.current) {
      hasFetched.current = true;
      // eslint-disable-next-line
      setLoading(true);
      fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to load coaching");
          const data = await res.json();
          if (data.report) {
            setReport(data.report);
            if (data.quota) setQuota(data.quota);
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Impossible de charger le coaching.");
          hasFetched.current = false; // Permettre retry si erreur?
        })
        .finally(() => setLoading(false));
    }
  }, [matchId, initialReport]);

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
              {t("coaching.title")}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {t("coaching.subtitle")}
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
        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {!isPro && !hasQuota && (
          <ConversionBanner variant="quota-exhausted" />
        )}

        {/* Coaching basique (gratuit) - toujours visible si report existe */}
        {loading && (
           <div className="mt-8 flex justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-cyan-400" />
           </div>
        )}
        
        {report && hasQuota && (
          <div className="mt-4 space-y-6">
            {/* Turning Point, Focus, Action - ACCESSIBLE GRATUITEMENT */}
            {(report.turningPoint ||
              report.focus ||
              report.action) && (
              <div className="grid gap-4 md:grid-cols-3">
                {report.turningPoint && (
                  <AnimatedItem>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                        {t("coaching.turningPoint")}
                      </div>
                      <p className="text-sm text-white/90">
                        {report.turningPoint.timestamp && (
                          <span className="font-semibold">
                            {report.turningPoint.timestamp}
                          </span>
                        )}{" "}
                        — {report.turningPoint.description}
                      </p>
                      {report.turningPoint.impact && (
                        <p className="mt-1 text-xs text-white/60">
                          {t("coaching.impact")} {report.turningPoint.impact}
                        </p>
                      )}
                    </div>
                  </AnimatedItem>
                )}
                {report.focus && (
                  <AnimatedItem>
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-purple-300">
                        {t("coaching.focus")}
                      </div>
                      <p className="text-sm text-white/90">
                        {report.focus.description}
                      </p>
                    </div>
                  </AnimatedItem>
                )}
                {report.action && (
                  <AnimatedItem>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                        {t("coaching.action")}
                      </div>
                      <p className="text-sm text-white/90">
                        {report.action.description}
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
                    {t("coaching.progressionObjectives")}
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
                      {t("coaching.moreObjectives", { count: String(auditNegative.length - 3) })}
                    </p>
                  )}
                </div>
              </AnimatedItem>
            )}

            {/* Positives & Negatives - ACCESSIBLE GRATUITEMENT (basique) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnimatedItem>
                <AuditCard 
                  title={t("coaching.strengths")} 
                  tone="good" 
                  items={isPro ? auditPositive : auditPositive.slice(0, 3)} 
                />
                {!isPro && auditPositive.length > 3 && (
                  <p className="mt-2 text-xs text-white/50 italic text-center">
                    {t("coaching.moreStrengths", { count: String(auditPositive.length - 3) })}
                  </p>
                )}
              </AnimatedItem>
              <AnimatedItem>
                <AuditCard
                  title={t("coaching.weaknesses")}
                  tone="bad"
                  items={isPro ? auditNegative : auditNegative.slice(0, 3)}
                />
                {!isPro && auditNegative.length > 3 && (
                  <p className="mt-2 text-xs text-white/50 italic text-center">
                    {t("coaching.moreWeaknesses", { count: String(auditNegative.length - 3) })}
                  </p>
                )}
              </AnimatedItem>
            </div>
          </div>
        )}

            {/* Sections premium (UNIQUEMENT pour tier Pro) */}
        {isPro && report && (report.rootCauses || report.actionPlan || report.drills) && (
          <div className="mt-6 space-y-6">
            {/* Causes racines */}
            {report.rootCauses && (
              <AnimatedItem>
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">
                    {t("coaching.rootCauses")}
                  </h3>
                  <div className="space-y-4">
                    {report.rootCauses.causes.map((cause, i) => (
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
            {report.actionPlan && (
              <AnimatedItem>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    {t("coaching.actionPlan")}
                  </h3>
                  <div className="space-y-4">
                    {report.actionPlan.rules.map((rule, i) => (
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
                            {rule.phase === "early" 
                              ? t("coaching.phase.early")
                              : rule.phase === "mid"
                              ? t("coaching.phase.mid")
                              : t("coaching.phase.late")}
                          </span>
                        </div>
                        {rule.antiErrors.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 text-xs font-medium text-white/50">
                              {t("coaching.errorsToAvoid")}
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
            {report.drills && (
              <AnimatedItem>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    {t("coaching.drills")}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {report.drills.exercises.map((exercise, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-white/90">
                            {exercise.exercise}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                            {exercise.games} {t("coaching.games")}
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
        {!report && !hasQuota && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-semibold text-white/90">
              {t("coaching.quotaExhausted")}
            </p>
            <p className="mt-2 text-sm text-white/60">
              {t("coaching.quotaExhaustedDesc")}
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


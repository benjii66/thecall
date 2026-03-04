"use client";

import { Check, Sparkles, Zap, Lock } from "lucide-react";
import Link from "next/link";
import { PRICING, TIER_LIMITS } from "@/types/pricing";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function PricingSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    fetch("/api/tier")
      .then((res) => res.json())
      .then((data) => {
        setTier(data.tier || "free");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), 
      });

      if (!res.ok) throw new Error("Erreur init checkout");
      
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la redirection Stripe.");
      setIsProcessing(false);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Comprends la bascule. Corrige la cause. Progresse.
        </h1>
        <p className="mt-4 text-lg text-white/60">
          Ton coach macro : causes → plan → progrès
        </p>
        <p className="mt-2 text-sm text-white/40">
          Pour les joueurs Bronze → Gold qui veulent monter d&apos;un palier
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Free Tier */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Free</h2>
            <p className="mt-2 text-sm text-white/60">
              Preuve de concept • Timeline + Win% + Coaching basique
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold">Gratuit</span>
            </div>
          </div>

          <ul className="mb-8 space-y-4">
            <FeatureItem
              text={`${TIER_LIMITS.free.coachingPerMonth} coachings par mois`}
              included={true}
            />
            <FeatureItem
              text="Coaching basique (heuristique)"
              included={true}
            />
            <FeatureItem text="Mini-profil (5-10 matchs)" included={true} />
            <FeatureItem text="Historique limité" included={true} />
            <FeatureItem text="Coaching IA premium" included={false} />
            <FeatureItem text="Profil complet (50+ matchs)" included={false} />
            <FeatureItem text="Export PDF" included={false} />
            <FeatureItem text="Support prioritaire" included={false} />
          </ul>

          {tier === "free" ? (
             <button
               disabled
               className="block w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-center font-semibold text-white/40 cursor-not-allowed"
             >
               Plan Actuel
             </button>
          ) : (
             <div className="text-center">
                <p className="text-sm text-white/40 mb-2">Inclus dans votre plan Pro</p>
                <button disabled className="block w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-center font-semibold text-white/40 cursor-not-allowed">
                    Plan Inclus
                </button>
             </div>
          )}
        </div>

        {/* Pro Tier */}
        <div className="relative rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-8 shadow-[0_0_0_1px_rgba(0,255,255,0.1),0_40px_120px_rgba(0,255,255,0.15)] backdrop-blur-md">
          {/* Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="rounded-full border border-cyan-500/50 bg-cyan-500/20 px-4 py-1 text-xs font-semibold text-cyan-300">
              Recommandé
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <h2 className="text-2xl font-semibold">Pro</h2>
              <span className="rounded-full border border-cyan-500/50 bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                Founders
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Coaching IA premium illimité • Patterns • Profil complet
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold">
                {PRICING.pro.monthlyLaunch}€
              </span>
              <span className="text-white/60">/mois</span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              <span className="line-through text-white/40">{PRICING.pro.monthly}€</span>{" "}
              Prix Founders (conservé tant que l&apos;abonnement reste actif) • ou {PRICING.pro.yearly}€/an (économise ~2 mois)
            </p>
          </div>

          <ul className="mb-8 space-y-4">
            <FeatureItem
              text="Coachings illimités"
              included={true}
              highlight={true}
            />
            <FeatureItem
              text="Coaching IA premium (GPT-4o-mini)"
              included={true}
              highlight={true}
            />
            <FeatureItem
              text="Profil complet (50+ matchs)"
              included={true}
              highlight={true}
            />
            <FeatureItem
              text="Historique illimité"
              included={true}
              highlight={true}
            />
            <FeatureItem text="Export PDF des rapports" included={true} />
            <FeatureItem text="Support prioritaire" included={true} />
          </ul>

          {tier === "pro" ? (
            <div className="space-y-3">
                <button
                    disabled
                    className="relative block w-full rounded-xl bg-white/10 px-6 py-3 text-center font-semibold text-white/40 border border-white/10 cursor-not-allowed"
                >
                    <span className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Plan Actuel (Founders)</span>
                    </span>
                </button>
                <button
                    onClick={handlePortal}
                    className="block w-full text-center text-xs text-cyan-300 hover:text-cyan-200 underline"
                >
                    Gérer mon abonnement
                </button>
            </div>
          ) : (
            <button
                onClick={handleUpgrade}
                disabled={isProcessing || loading}
                className="relative block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 text-center font-semibold text-black transition hover:from-cyan-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className="flex items-center justify-center gap-2">
                {isProcessing || loading ? (
                    <span>Chargement...</span>
                ) : (
                    <>
                    <Zap className="h-4 w-4" />
                    <span>Upgrade Pro</span>
                    </>
                )}
                </span>
            </button>
          )}

      {/* Success Modal / Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#0a0a10] p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 rounded-full bg-cyan-500/10 p-4 ring-1 ring-cyan-500/30">
                        <Sparkles className="h-8 w-8 text-cyan-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Bienvenue chez les Founders ! 🚀</h2>
                    <p className="mt-2 text-white/60">
                        Merci pour ton soutien. Ton abonnement est actif et tu as maintenant accès à toutes les fonctionnalités Pro.
                    </p>
                    <Link 
                        href="/match"
                        className="mt-8 w-full rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:bg-cyan-400"
                    >
                        Go analyser mes matchs !
                    </Link>
                    <button
                        onClick={() => window.history.replaceState({}, '', '/pricing')}
                        className="mt-4 text-sm text-white/40 hover:text-white"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
      )}

          <p className="mt-3 text-center text-xs text-white/50">
            Paiement sécurisé via Stripe
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="mb-8 text-2xl font-semibold">Questions fréquentes</h2>
        <div className="space-y-6">
          <FAQItem
            question="Qu'est-ce que le coaching basique vs premium ?"
            answer="Le coaching basique utilise des heuristiques (règles prédéfinies) pour analyser tes matchs. Le coaching premium utilise l'IA (GPT-4o-mini) pour des insights plus profonds, personnalisés et contextuels."
          />
          <FAQItem
            question="Puis-je changer de plan plus tard ?"
            answer="Oui, tu peux upgrade ou downgrade à tout moment. Les changements prennent effet immédiatement."
          />
          <FAQItem
            question="Que se passe-t-il si je dépasse mon quota free ?"
            answer="Tu recevras une notification et un lien pour upgrade Pro. Les coachings précédents restent accessibles."
          />
          <FAQItem
            question="Le prix Founders est définitif ?"
            answer="Oui, le prix Founders (3.99€/mois) est conservé tant que ton abonnement reste actif. Le prix normal sera de 5.99€/mois pour les nouveaux utilisateurs."
          />
          <FAQItem
            question="Y a-t-il une garantie ?"
            answer="Si le coaching ne t'apporte aucun insight exploitable sur tes 2 premières analyses IA, on te rembourse."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureItem({
  text,
  included,
  highlight = false,
}: {
  text: string;
  included: boolean;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      {included ? (
        <Check
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
            highlight ? "text-cyan-300" : "text-emerald-400"
          }`}
        />
      ) : (
        <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/20" />
      )}
      <span
        className={`text-sm ${
          included
            ? highlight
              ? "text-cyan-200 font-medium"
              : "text-white/90"
            : "text-white/40 line-through"
        }`}
      >
        {text}
      </span>
    </li>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-semibold text-white/90">{question}</h3>
      <p className="mt-2 text-sm text-white/60">{answer}</p>
    </div>
  );
}

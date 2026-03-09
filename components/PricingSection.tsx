"use client";

import { Check, Sparkles, Zap, Lock } from "lucide-react";
import Link from "next/link";
import { PRICING, TIER_LIMITS } from "@/types/pricing";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function PricingSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [isAnnual, setIsAnnual] = useState(false);
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
      const priceId = isAnnual 
        ? PRICING.pro.stripePriceId.yearly 
        : PRICING.pro.stripePriceId.monthlyLaunch;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }), 
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

      {/* Toggle */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex rounded-full border border-white/10 p-1 bg-white/5 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setIsAnnual(false)}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${!isAnnual ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25' : 'text-white/60 hover:text-white'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25' : 'text-white/60 hover:text-white'}`}
          >
            Annuel <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isAnnual ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'}`}>-30%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Free Tier */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Free</h2>
            <p className="mt-2 text-sm text-white/60">
              Teste la puissance de The Call sans engagement
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold">Gratuit</span>
            </div>
          </div>

          <ul className="mb-8 space-y-4">
            <FeatureItem
              text={`${TIER_LIMITS.free.coachingPerMonth} analyses The Call par mois`}
              included={true}
            />
            <FeatureItem
              text="Identification du point de basculement"
              included={true}
            />
            <FeatureItem text="Historique limité (5 matchs)" included={true} />
            <FeatureItem text="Analyses IA illimitées" included={false} />
            <FeatureItem text="Temps de réponse prioritaire" included={false} />
            <FeatureItem text="Support premium dédié" included={false} />
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

        {/* Pro Tier (FOUNDERS EDITION) */}
        <div className="relative rounded-3xl border-2 border-cyan-500/80 bg-gradient-to-br from-cyan-500/20 via-black to-violet-500/20 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-xl transition-transform hover:scale-[1.02]">
          {/* Glowing Top Edge */}
          <div className="absolute inset-x-0 -top-px h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          
          {/* Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="relative flex items-center gap-1 rounded-full border border-cyan-400 bg-cyan-950 px-4 py-1 text-xs font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
               <span className="relative flex h-2 w-2 mr-1">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
               </span>
              ÉDITION FOUNDERS
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300">Pro</h2>
            </div>
            <p className="mt-3 text-sm font-medium text-cyan-100/80">
              L'outil ultime pour progresser rapidement et durablement
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {isAnnual ? PRICING.pro.yearly : PRICING.pro.monthlyLaunch}€
              </span>
              <span className="text-white/60 font-medium">/{isAnnual ? 'an' : 'mois'}</span>
            </div>
            
            <div className="mt-3 flex flex-col gap-1 h-12">
              {!isAnnual ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white/30 line-through decoration-red-500/50 decoration-2">{PRICING.pro.monthly}€/mois</span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      -33% À VIE
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Prix bloqué au renouvellement. Annulable en un clic.
                  </p>
                </>
              ) : (
                 <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white/30 line-through decoration-red-500/50 decoration-2">71.88€/an</span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      -45% À VIE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400/80 font-medium">
                    Soit ~3.33€/mois. Facturé annuellement.
                  </p>
                </>
              )}
            </div>
          </div>

          <ul className="mb-8 space-y-4">
            <FeatureItem
              text="Analyses IA The Call illimitées"
              included={true}
              highlight={true}
            />
            <FeatureItem
              text="Conseils macro personnalisés"
              included={true}
              highlight={true}
            />
            <FeatureItem
              text="Historique des matchs sauvegardé"
              included={true}
              highlight={true}
            />
            <FeatureItem
              text="Temps de réponse prioritaire"
              included={true}
              highlight={true}
            />
            <FeatureItem text="Support premium dédié" included={true} />
          </ul>

          {tier === "pro" ? (
            <div className="space-y-3">
                <button
                    disabled
                    className="relative block w-full rounded-xl bg-violet-600/20 px-6 py-3 text-center font-bold text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] cursor-not-allowed"
                >
                    <span className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Plan Actuel (Founders)</span>
                    </span>
                </button>
                <button
                    onClick={handlePortal}
                    className="block w-full text-center text-xs text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
                >
                    Gérer mon abonnement
                </button>
            </div>
          ) : (
             <button
                onClick={handleUpgrade}
                disabled={isProcessing || loading}
                className="relative block w-full overflow-hidden rounded-xl bg-white px-6 py-3 font-bold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 group shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-cyan-400/20 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                {isProcessing || loading ? (
                    <span>Chargement...</span>
                ) : (
                    <>
                    <Zap className="h-4 w-4" />
                    <span>Passer à The Call Pro</span>
                    </>
                )}
                </span>
            </button>
          )}

          <p className="mt-3 text-center text-xs text-white/50">
            Paiement sécurisé via Stripe
          </p>
        </div>
      </div>

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

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="mb-8 text-2xl font-semibold">Questions fréquentes</h2>
        <div className="space-y-6">
          <FAQItem
            question="Comment fonctionne l'IA de The Call ?"
            answer="Notre IA analyse la timeline de ta partie (différence d'or, positionnement, objectifs) pour détecter le 'point de basculement' exact où la game a commencé à t'échapper. Elle te fournit ensuite 1 conseil de macro-jeu concret pour t'améliorer."
          />
          <FAQItem
            question="Puis-je changer de plan plus tard ?"
            answer="Oui, tu peux upgrade à tout moment, et annuler ton abonnement en un clic. En cas d'annulation, ton statut Pro reste garanti jusqu'à la date de fin de la facturation."
          />
          <FAQItem
            question="Que se passe-t-il si je dépasse mon quota free ?"
            answer="Tu ne pourras plus lancer d'analyses complètes sur tes nouveaux matchs jusqu'au mois suivant. Tu auras néanmoins toujours accès depuis l'historique à tes anciens matchs."
          />
          <FAQItem
            question="Le prix Founders est définitif ?"
            answer="Félicitations pour ton early-access ! Oui, tant que tu gardes ton abonnement actif sans interruption, tu honoreras ce tarif à vie, même lorsque thecall.tech repassera au tarif national (5.99€)."
          />
          <FAQItem
            question="Y a-t-il un abonnement annuel ?"
            answer="Oui, tu peux choisir l'abonnement annuel (39.99€) directement en haut de cette page grâce au sélecteur, te permettant d'économiser environ 45% sur le tarif standard mensuel lissé sur l'année."
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

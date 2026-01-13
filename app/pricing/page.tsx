import { NavbarWrapper } from "@/components/NavbarWrapper";
import { Check, Sparkles, Zap, Lock } from "lucide-react";
import Link from "next/link";
import { PRICING, TIER_LIMITS } from "@/types/pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />

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

            <Link
              href="/match"
              className="block w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-center font-semibold transition hover:bg-white/10"
            >
              Commencer gratuitement
            </Link>
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

            <button
              disabled
              className="relative block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 text-center font-semibold text-black transition hover:from-cyan-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                Upgrade Pro (bientôt)
              </span>
            </button>

            <p className="mt-3 text-center text-xs text-white/50">
              Stripe checkout en cours d&apos;intégration
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
    </main>
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

function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] noise" />
    </div>
  );
}

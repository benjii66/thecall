// types/pricing.ts

export type SubscriptionTier = "free" | "pro";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export type UserSubscription = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export type TierLimits = {
  coachingPerMonth: number; // -1 = illimité (limite l'action "Coach", pas la consultation)
  coachingQuality: "basic" | "premium"; // basic = heuristique, premium = LLM
  profileGlobal: "mini" | "full" | false; // mini = 5-10 matchs, full = 50+, false = bloqué
  historiqueMatchs: number; // -1 = illimité, nombre de matchs consultables
  exportPDF: boolean;
  shareWithoutWatermark: boolean; // Free = avec watermark, Pro = sans
  causesRacines: boolean; // Section premium coaching
  planAction: boolean; // Section premium coaching
  drills: boolean; // Section premium coaching
  rapportMensuel: boolean; // Rapport mensuel de progression
  prioritySupport: boolean;
};

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    coachingPerMonth: 5, // 5 coachings par mois (limite l'action, pas la consultation)
    coachingQuality: "basic", // Coaching heuristique uniquement
    profileGlobal: "mini", // Mini-profil basé sur 5-10 matchs
    historiqueMatchs: 5, // 5 derniers matchs consultables
    exportPDF: false, // Pas d'export PDF
    shareWithoutWatermark: false, // Partage avec watermark "Free"
    causesRacines: false, // Section premium verrouillée
    planAction: false, // Section premium verrouillée
    drills: false, // Section premium verrouillée
    rapportMensuel: false, // Pas de rapport mensuel
    prioritySupport: false,
  },
  pro: {
    coachingPerMonth: -1, // Illimité (avec fair-use silencieux 50-100/mois)
    coachingQuality: "premium", // Coaching LLM premium
    profileGlobal: "full", // Profil complet avec 50+ matchs
    historiqueMatchs: -1, // Historique illimité
    exportPDF: true, // Export PDF des rapports
    shareWithoutWatermark: true, // Partage sans watermark
    causesRacines: true, // Causes racines débloquées
    planAction: true, // Plan d'action débloqué
    drills: true, // Drills débloqués
    rapportMensuel: true, // Rapport mensuel de progression
    prioritySupport: true,
  },
};

export const PRICING = {
  pro: {
    monthly: 5.99, // 5.99€/mois
    monthlyLaunch: 3.99, // 3.99€/mois (promo early adopters)
    yearly: 39.99, // 39.99€/an (~3.33€/mois)
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "",
      monthlyLaunch: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_LAUNCH || "",
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || "",
    },
  },
} as const;

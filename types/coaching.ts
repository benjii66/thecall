export type CoachingInsight = {
  type: "turning_point" | "focus" | "action" | "positive" | "negative";
  title: string;
  description: string;
  timestamp?: string; // "15:23" pour turning_point
  impact?: string; // "+12% win prob" ou "-18% win prob"
  priority?: "high" | "medium" | "low";
};

export type RootCauses = {
  title: string;
  causes: Array<{
    cause: string;
    evidence: string[]; // Événements, timings précis
    timing?: string; // "12:30" par exemple
  }>;
};

export type ActionPlan = {
  title: string;
  rules: Array<{
    rule: string;
    phase: "early" | "mid" | "late";
    antiErrors: string[]; // Erreurs à éviter
  }>;
};

export type Drills = {
  title: string;
  exercises: Array<{
    exercise: string;
    description: string;
    games: number; // Nombre de games pour pratiquer
  }>;
};

export type BuildAnalysis = {
  title: string;
  critique: string;
  suggestions: Array<{
    item: string;
    reason: string;
    replace: string;
  }>;
};

export type CoachingReport = {
  turningPoint?: CoachingInsight;
  focus?: CoachingInsight;
  action?: CoachingInsight;
  positives: CoachingInsight[];
  negatives: CoachingInsight[];
  summary?: string;
  // Sections premium (uniquement pour tier Pro)
  rootCauses?: RootCauses;
  actionPlan?: ActionPlan;
  drills?: Drills;
  buildAnalysis?: BuildAnalysis;
  quality?: string;
};

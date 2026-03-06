
import type { MatchPageData } from "@/types/match";
import type { CoachingReport } from "@/types/coaching";
import { computeWinProbability } from "@/lib/winProbability";

export function generateHeuristicReport(
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): CoachingReport {
  const { me, opponent, timelineEvents } = matchData;
  const winProb = winProbData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function safe(n: any) { return typeof n === 'number' ? n : 0; }

  // Game Duration
  const durationMin = (winProb[winProb.length - 1]?.minute || 20);

  // Turn Point
  let maxChange = 0;
  let turningPointMinute = 0;
  for (let i = 1; i < winProb.length; i++) {
    const change = winProb[i].probability - winProb[i - 1].probability;
    if (Math.abs(change) > Math.abs(maxChange)) {
      maxChange = change;
      turningPointMinute = winProb[i].minute;
    }
  }
  const turningPointEvent = timelineEvents.find(
    (e) => e.minute === turningPointMinute
  );

  // Objectives
  const objectives = timelineEvents.filter(
    (e) => e.kind === "dragon" || e.kind === "herald" || e.kind === "baron"
  );
  const allyObjectives = objectives.filter((e) => e.team === "ally").length;
  const enemyObjectives = objectives.filter((e) => e.team === "enemy").length;

  // New Metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myCS = safe((me as any).cs);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opCS = safe((opponent as any)?.cs);
  const csDiff = myCS - opCS;
  const csPerMin = myCS / durationMin;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myVision = safe((me as any).visionScore);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opVision = safe((opponent as any)?.visionScore);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myDamage = safe((me as any).damage);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opDamage = safe((opponent as any)?.damage);

  // Heuristic Logic
  let focusTitle = "Tempo & Macro";
  let focusDesc = "Maintiens la pression sur la carte.";
  
  if (csPerMin < 6) {
    focusTitle = "Farming & Ressources";
    focusDesc = `Tu as ${csPerMin.toFixed(1)} CS/min. C'est trop bas pour carry. Concentre-toi sur les waves avant de décaler.`;
  } else if (me.kp < 45 && me.role !== "Top") {
    focusTitle = "Présence en combat";
    focusDesc = `Ton KP est de ${me.kp}%. Tu joues trop passif ou tu arrives en retard aux fights.`;
  } else if (allyObjectives < enemyObjectives) {
    focusTitle = "Contrôle des Objectifs";
    focusDesc = "L'équipe ennemie contrôle les neutrales. Prépare la vision 1min avant le spawn.";
  } else if (myVision < 10 && durationMin > 20) {
    focusTitle = "Vision & Map Control";
    focusDesc = "Ton score de vision est critique. Achète des Pink Wards et utilise ton trinket.";
  }

  // Action Next Game
  let actionTitle = "Optimiser le Farming";
  let actionDesc = "Ne rate aucun last hit free.";
  
  if (focusTitle.includes("Vision")) {
    actionTitle = "Plan Vision";
    actionDesc = "Pose une ward à chaque back ou transition jungle/river.";
  } else if (me.deaths > 7) {
    actionTitle = "Jouer la survie";
    actionDesc = "Arrête de facecheck. Tes morts coûtent trop cher à ton équipe.";
  }

  // Positives
  const positives = [];
  if (csPerMin > 7.5) positives.push({ type: "positive", title: "Pro du Farming", description: `Excellent farm (${csPerMin.toFixed(1)} CS/min). Tu as optimisé tes revenus.` });
  else if (csPerMin > 6.5) positives.push({ type: "positive", title: "Bon Farming", description: `${csPerMin.toFixed(1)} CS/min, solide.` });
  
  if (me.kp > 70) positives.push({ type: "positive", title: "Omniprésent", description: `KP de ${me.kp}%. Tu es le moteur des combats de ton équipe.` });
  else if (me.kp > 50) positives.push({ type: "positive", title: "Bonne Présence", description: "Tu es là quand ça bagarre." });
  
  if (myDamage > opDamage * 1.5) positives.push({ type: "positive", title: "Carry Hard", description: "Tu as pulvérisé ton vis-à-vis aux dégâts." });
  else if (myDamage > opDamage * 1.2) positives.push({ type: "positive", title: "Gros Dégâts", description: "Tu as out-damage ton vis-à-vis." });
  
  if (allyObjectives >= 4) positives.push({ type: "positive", title: "Objectif Focus", description: "Très bonne sécurisation des objectifs neutres." });
  
  if (positives.length === 0) positives.push({ type: "positive", title: "Esprit d'équipe", description: "Tu as joué jusqu'au bout." });

  // Negatives
  const negatives = [];
  // 1. CS Check
  if (csPerMin < 5.0) negatives.push({ type: "negative", title: "Revenu critique", description: `Seulement ${csPerMin.toFixed(1)} CS/min. Tu manques de ressources pour carry.` });
  else if (csPerMin < 6.2 && (me.role === "ADC" || me.role === "Mid")) negatives.push({ type: "negative", title: "Farming perfectible", description: "Tu perds trop d'or sur les sbires en mid-game." });

  // 2. Deaths Check
  if (me.deaths > 8) negatives.push({ type: "negative", title: "Survie critique", description: `Tes ${me.deaths} morts ont donné trop d'avance à l'ennemi.` });
  else if (me.deaths > 5 && me.deaths > me.kills) negatives.push({ type: "negative", title: "Prendre trop de risques", description: "Tu donnes trop de gold à l'ennemi sur des erreurs de placement." });

  // 3. Vision Check
  if (myVision < 8 && durationMin > 15) negatives.push({ type: "negative", title: "Vision aveugle", description: "Ton score de vision est trop bas. Utilise ton trinket pour éviter les ganks." });
  else if (myVision < opVision * 0.6 && me.role !== "ADC") negatives.push({ type: "negative", title: "Retard de vision", description: "L'adversaire contrôle la carte bien mieux que toi." });

  // 4. KP Check
  if (me.kp < 35 && me.role !== "Top") negatives.push({ type: "negative", title: "Isolement", description: `KP de ${me.kp}%. Tu joues trop éloigné des actions décisives.` });

  // 5. Objective Contribution
  if (allyObjectives === 0 && durationMin > 15) negatives.push({ type: "negative", title: "Macro stérile", description: "Aucun objectif neutre sécurisé. Travaille ton contrôle de map." });

  // 6. Role Specific
  if (me.role === "Support" && myVision < 25 && durationMin > 20) negatives.push({ type: "negative", title: "Support passif", description: "En tant que support, ton contrôle de vision doit être une priorité." });

  // Ensure at least 3 negatives for "a bit to eat" (free tier)
  if (negatives.length < 3) {
    const fallbacks = [
      { type: "negative", title: "Optimisation des Backs", description: "Vérifie tes timings de reset pour ne pas perdre de tempo sur la carte." },
      { type: "negative", title: "Contrôle de Vision", description: "Utilise tes balises de contrôle pour sécuriser les entrées de jungle." },
      { type: "negative", title: "Gestion des Waves", description: "Assure-toi de push ta wave avant de décaler pour ne pas perdre de plaques." }
    ];
    for (const f of fallbacks) {
      if (negatives.length >= 3) break;
      if (!negatives.some(n => n.title === f.title)) {
        negatives.push(f);
      }
    }
  }

  return {
    turningPoint: {
      type: "turning_point",
      title: "Moment clé",
      description: turningPointEvent
        ? `${turningPointMinute}:00 — ${turningPointEvent.label}`
        : `${turningPointMinute}:00 — Changement de tempo`,
      timestamp: `${turningPointMinute}:${String(Math.floor((turningPointMinute % 1) * 60)).padStart(2, "0")}`,
      impact: `${maxChange > 0 ? "+" : ""}${maxChange.toFixed(0)}% proba de victoire`,
    },
    focus: {
      type: "focus",
      title: focusTitle,
      description: focusDesc,
    },
    action: {
      type: "action",
      title: actionTitle,
      description: actionDesc,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    positives: positives.slice(0, 2) as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    negatives: negatives.slice(0, 2) as any[],
    
    // Sections premium (Heuristic Fallback)
    ...(isPremium ? {
      rootCauses: {
        title: "Causes racines (IA indisponible)",
        causes: [
          {
            cause: csDiff < -20 ? "Retard de Gold/XP important" : "Mauvaise gestion des fights",
            evidence: [
              csDiff < -20 ? `Tu as ${Math.abs(csDiff)} CS de moins que ton opposant.` : `KDA: ${me.kda}`,
              `Vision Score: ${myVision} vs ${opVision}`
            ],
            timing: "Global"
          },
        ],
      },
      actionPlan: {
        title: "Plan d'action (Heuristique)",
        rules: [
          {
            rule: "Focus sur ton revenu (CS/Gold)",
            phase: "early",
            antiErrors: ["Ne pas chase les kills sans vision", "Ne pas rater de wave sous tour"]
          }
        ],
      },
      drills: {
        title: "Exercices recommandés (Fallback)",
        exercises: [
          {
            exercise: "Drill de Farm",
            description: "Lance une custom game et vise 80 CS à 10min sans opposant.",
            games: 1
          }
        ]
      }
    } : {}),
  };
}

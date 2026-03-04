
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
  if (csPerMin > 7) positives.push({ type: "positive", title: "Bon Farming", description: `${csPerMin.toFixed(1)} CS/min, solide.` });
  if (me.kp > 60) positives.push({ type: "positive", title: "Bonne Présence", description: "Tu es là quand ça bagarre." });
  if (myDamage > opDamage * 1.2) positives.push({ type: "positive", title: "Gros Dégâts", description: "Tu as out-damage ton vis-à-vis." });
  if (positives.length === 0) positives.push({ type: "positive", title: "Esprit d'équipe", description: "Tu as joué jusqu'au bout." });

  // Negatives
  const negatives = [];
  if (csPerMin < 5.5) negatives.push({ type: "negative", title: "Farming faible", description: "Tu perds trop d'or sur les sbires." });
  if (me.deaths > 6) negatives.push({ type: "negative", title: "Trop de morts", description: "Tu donnes trop de gold à l'ennemi." });
  if (myVision < opVision * 0.5) negatives.push({ type: "negative", title: "Vision abyssale", description: "L'adversaire voit tout, toi rien." });
  if (negatives.length === 0) negatives.push({ type: "negative", title: "Manque d'impact", description: "Essaie de peser plus sur la game." });


  return {
    turningPoint: {
      type: "turning_point",
      title: "Moment clé",
      description: turningPointEvent
        ? `${turningPointMinute}:00 — ${turningPointEvent.label}`
        : `${turningPointMinute}:00 — Changement de tempo`,
      timestamp: `${turningPointMinute}:${String(Math.floor((turningPointMinute % 1) * 60)).padStart(2, "0")}`,
      impact: `${maxChange > 0 ? "+" : ""}${maxChange.toFixed(0)}% win prob`,
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

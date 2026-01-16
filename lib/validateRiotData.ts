// lib/validateRiotData.ts - Validation stricte des données Riot API

import type { RiotMatch, RiotTimeline } from "./riotTypes";

/**
 * Valide qu'un objet est un RiotMatch valide
 */
export function validateRiotMatch(data: unknown): data is RiotMatch {
  if (!data || typeof data !== "object") return false;
  
  const match = data as Record<string, unknown>;
  
  // Vérifier metadata
  if (!match.metadata || typeof match.metadata !== "object") return false;
  const metadata = match.metadata as Record<string, unknown>;
  if (typeof metadata.matchId !== "string" || metadata.matchId.length === 0) return false;
  
  // Vérifier info
  if (!match.info || typeof match.info !== "object") return false;
  const info = match.info as Record<string, unknown>;
  
  // Vérifier les champs essentiels
  if (typeof info.gameDuration !== "number" || info.gameDuration < 0) return false;
  if (typeof info.queueId !== "number") return false;
  if (!Array.isArray(info.participants)) return false;
  
  // Vérifier que participants a au moins 10 éléments (5v5)
  if (info.participants.length < 10) return false;
  
  // Valider chaque participant
  for (const participant of info.participants) {
    if (!validateParticipant(participant)) return false;
  }
  
  return true;
}

/**
 * Valide un participant
 */
function validateParticipant(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  
  const p = data as Record<string, unknown>;
  
  // Champs obligatoires
  if (typeof p.puuid !== "string" || p.puuid.length === 0) return false;
  if (typeof p.championName !== "string" || p.championName.length === 0) return false;
  if (typeof p.teamId !== "number" || (p.teamId !== 100 && p.teamId !== 200)) return false;
  if (typeof p.kills !== "number" || p.kills < 0 || p.kills > 100) return false;
  if (typeof p.deaths !== "number" || p.deaths < 0 || p.deaths > 100) return false;
  if (typeof p.assists !== "number" || p.assists < 0 || p.assists > 100) return false;
  if (typeof p.goldEarned !== "number" || p.goldEarned < 0) return false;
  if (typeof p.win !== "boolean") return false;
  
  // Items (optionnels mais doivent être des nombres valides)
  for (let i = 0; i <= 6; i++) {
    const item = p[`item${i}`];
    if (item !== undefined && (typeof item !== "number" || item < 0)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Valide qu'un objet est un RiotTimeline valide
 */
export function validateRiotTimeline(data: unknown): data is RiotTimeline {
  if (!data || typeof data !== "object") return false;
  
  const timeline = data as Record<string, unknown>;
  
  // Vérifier metadata
  if (!timeline.metadata || typeof timeline.metadata !== "object") return false;
  const metadata = timeline.metadata as Record<string, unknown>;
  if (typeof metadata.matchId !== "string" || metadata.matchId.length === 0) return false;
  
  // Vérifier info
  if (!timeline.info || typeof timeline.info !== "object") return false;
  const info = timeline.info as Record<string, unknown>;
  
  // Vérifier frames
  if (!Array.isArray(info.frames)) return false;
  
  // Valider chaque frame (limiter à 100 frames max pour éviter les données malformées)
  if (info.frames.length > 100) return false;
  
  for (const frame of info.frames) {
    if (!validateFrame(frame)) return false;
  }
  
  return true;
}

/**
 * Valide une frame de timeline
 */
function validateFrame(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  
  const frame = data as Record<string, unknown>;
  
  // Vérifier timestamp
  if (typeof frame.timestamp !== "number" || frame.timestamp < 0) return false;
  
  // Vérifier events (optionnel mais doit être un array si présent)
  if (frame.events !== undefined && !Array.isArray(frame.events)) return false;
  
  // Limiter le nombre d'events par frame (protection DoS)
  if (Array.isArray(frame.events) && frame.events.length > 1000) return false;
  
  return true;
}

/**
 * Valide la taille d'une réponse Riot API
 */
export function validateRiotResponseSize(data: unknown, maxSizeBytes: number = 10 * 1024 * 1024): boolean {
  try {
    const jsonString = JSON.stringify(data);
    return jsonString.length <= maxSizeBytes;
  } catch {
    return false;
  }
}

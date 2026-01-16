// lib/utils.ts - Utilitaires généraux

/**
 * Combine les classes CSS de manière sûre
 * Version simplifiée sans dépendances externes
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs
    .filter((input) => input && typeof input === "string")
    .join(" ")
    .trim();
}

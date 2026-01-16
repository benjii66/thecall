// lib/env.ts - Validation des variables d'environnement au démarrage

/**
 * Valide que toutes les variables d'environnement requises sont présentes
 * et lance une erreur explicite si une variable manque
 */
export function validateEnv(): void {
  const required = [
    "RIOT_API_KEY",
  ] as const;

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(", ")}\n` +
      `Vérifie ton fichier .env.local`
    );
  }
}

/**
 * Récupère une variable d'environnement avec une valeur par défaut optionnelle
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  
  if (value === undefined) {
    throw new Error(`Variable d'environnement ${key} est requise mais non définie`);
  }
  
  return value;
}

/**
 * Récupère une variable d'environnement booléenne
 */
export function getEnvBool(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Récupère une variable d'environnement numérique
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) return defaultValue;
  if (!value) throw new Error(`Variable d'environnement ${key} est requise`);
  
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Variable d'environnement ${key} doit être un nombre, reçu: ${value}`);
  }
  
  return num;
}

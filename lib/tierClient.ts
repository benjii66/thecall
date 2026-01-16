"use client";

// Fonctions client-side pour gérer le tier en mode développement (localStorage)

const TIER_STORAGE_KEY = "dev_tier";

export function getClientTier(): "free" | "pro" {
  if (typeof window === "undefined") return "free";
  
  const stored = localStorage.getItem(TIER_STORAGE_KEY);
  if (stored === "free" || stored === "pro") {
    return stored;
  }
  return "free";
}

export function setClientTier(tier: "free" | "pro"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TIER_STORAGE_KEY, tier);
  // Déclencher un événement pour notifier les autres composants
  window.dispatchEvent(new Event("tierChanged"));
}

export async function switchTier(tier: "free" | "pro"): Promise<{ success: boolean; message: string }> {
  try {
    // En mode dev, utiliser directement localStorage
    // On détecte le mode dev en vérifiant si on est côté client
    if (typeof window !== "undefined") {
      setClientTier(tier);
      return {
        success: true,
        message: `Tier changé en ${tier}. Recharge la page pour voir les changements.`,
      };
    }
    
    // En production, utiliser l'API
    const response = await fetch("/api/tier/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    
    const data = await response.json();
    if (response.ok) {
      setClientTier(tier);
    }
    return data;
  } catch {
    return {
      success: false,
      message: "Erreur lors du changement de tier",
    };
  }
}

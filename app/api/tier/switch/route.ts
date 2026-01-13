// API route pour changer le tier en mode développement (local uniquement)
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Vérifier que nous sommes en mode développement
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Cette fonctionnalité n'est disponible qu'en mode développement" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { tier } = body;

    if (tier !== "free" && tier !== "pro") {
      return NextResponse.json(
        { error: "Tier invalide. Utilise 'free' ou 'pro'" },
        { status: 400 }
      );
    }

    // En mode dev, on stocke dans une variable d'environnement côté client
    // Le client utilisera localStorage pour persister
    return NextResponse.json({
      success: true,
      tier,
      message: `Tier changé en ${tier}. Recharge la page pour voir les changements.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du changement de tier" },
      { status: 500 }
    );
  }
}

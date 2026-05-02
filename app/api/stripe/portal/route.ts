export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { validateOrigin } from "@/lib/security";
import { getAuthUserSafe } from "@/lib/session";
import { isDemoModeActive } from "@/lib/settings";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });

  if (await isDemoModeActive()) {
      return NextResponse.json({ error: "Le portail de facturation est désactivé pendant la période de validation." }, { status: 403 });
  }

  try {
    const userId = await getAuthUserSafe();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    // Create Stripe Portal Session
    // This allows the user to manage their subscription (cancel, update payment method, etc.)
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const appUrl = `${protocol}://${host}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

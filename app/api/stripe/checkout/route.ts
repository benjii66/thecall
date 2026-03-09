import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ensureUser } from "@/lib/db/ensureUser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, priceId } = body; 

    if (!userId) {
        const puuid = process.env.MY_PUUID || process.env.NEXT_PUBLIC_PUUID;
        if (puuid) {
            try {
                const user = await ensureUser({ riotPuuid: puuid });
                userId = user.id;
            } catch (e) {
                logger.error("Failed to resolve user from PUUID", e);
            }
        }
    }

    if (!userId) {
        return NextResponse.json({ error: "User ID required and could not be resolved" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use environment price ID by default if not provided
    const targetPriceId = priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
    
    console.log("[Stripe Checkout] Incoming PriceId from Body:", priceId);
    console.log("[Stripe Checkout] Fallback PriceId from Env (PRO):", process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO);
    console.log("[Stripe Checkout] Final Target PriceId:", targetPriceId);

    if (!targetPriceId) {
        logger.error("Missing Stripe Price ID configuration");
        return NextResponse.json({ error: "Server misconfiguration: No Price ID" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: targetPriceId,
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/pricing?success=true`, 
      cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
      client_reference_id: userId,
      customer_email: user.email || undefined,
      metadata: {
        userId: userId,
        environment: process.env.NODE_ENV
      },
      allow_promotion_codes: true, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    logger.error("Stripe Checkout Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

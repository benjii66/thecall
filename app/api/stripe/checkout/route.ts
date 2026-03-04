import { NextRequest, NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ensureUser } from "@/lib/db/ensureUser"; // Import ensureUser

// Helper to get user ID (replace with your actual auth logic)
// Since we saw 'userId' usage in other files (e.g. tiers), we'll assume a way to get it.
// If using NextAuth: const session = await getServerSession(authOptions);
// PROVISIONAL: We'll assume the client sends the userId or we get it from session/cookie.
// For security *best practice*, we should get it from a server-side session.
// Looking at 'app/api/profile/route.ts', it seems there's no strict auth yet?
// -> user provides PUUID or we identify via cookie?
// Let's look at `ensureUser` logic usage. 
// Ideally, the USER ID should be passed or retrieved. 
// For V1, if not fully authenticated, we might rely on the client sending the ID (INSECURE but matches current state?)
// WAIT: The webhook implementation uses `client_reference_id` to link to a User.
// We must ensure the User exists in DB before checkout.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, priceId } = body; 
    // userId is mandatory to link the subscription later

    // Logic to resolve User ID if not passed (Single User / Env Mode)
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

    // Optional: Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use environment price ID by default if not provided
    const targetPriceId = priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;

    if (!targetPriceId) {
        logger.error("Missing Stripe Price ID configuration");
        return NextResponse.json({ error: "Server misconfiguration: No Price ID" }, { status: 500 });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: targetPriceId,
          quantity: 1,
        },
      ],
      // Success/Cancel URLs
      // Adjust domain dynamically in prod
      success_url: `${req.nextUrl.origin}/pricing?success=true`, 
      cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
      
      // Metadata to link the payment to the user in the Webhook
      client_reference_id: userId,
      customer_email: user.email || undefined, // Prefill email if known
      metadata: {
        userId: userId,
        environment: process.env.NODE_ENV
      },
      // Optional: Allow promotion codes
      allow_promotion_codes: true, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    logger.error("Stripe Checkout Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

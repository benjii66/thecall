export const runtime = "nodejs";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { logger } from "@/lib/logger";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    if (!signature || !endpointSecret) {
         // Allow skip signature in dev if explicit (not recommended but useful for testing) or just fail
         throw new Error("Missing signature or secret");
    }
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    logger.error("Webhook signature verification failed.", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.client_reference_id) {
             const userId = session.client_reference_id;
             const customerId = session.customer as string;

             await prisma.user.update({
                 where: { id: userId },
                 data: { stripeCustomerId: customerId }
             });
             
             // Optionally fetch subscription details immediately or wait for subscription.created
             logger.info(`Linked Stripe Customer ${customerId} to User ${userId}`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`[Webhook] Processing subscription event: ${event.type}`, { subscriptionId: subscription.id });

        const customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer?.id;

        if (!customerId) {
            console.error("[Webhook] No customerId found in subscription");
            break;
        }

        // Find user by stripeCustomerId
        const user = await prisma.user.findUnique({
             where: { stripeCustomerId: customerId }
        });

        if (user) {
            const status = subscription.status;
            const isPro = status === "active" || status === "trialing";
            const tier = isPro ? "pro" : "free";

            // Stripe dates are in seconds, Date constructor expects ms
            const currentPeriodEnd = (subscription as any).current_period_end;
            const endDate = currentPeriodEnd 
                ? new Date(currentPeriodEnd * 1000) 
                : undefined;
            
            const priceId = subscription.items?.data?.[0]?.price?.id || null;

            logger.info(`[Webhook] Updating user ${user.id} subscription. Status: ${status}, Tier: ${tier}, Price: ${priceId}`);

            try {
                await prisma.subscription.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        status: subscription.status,
                        plan: tier,
                        priceId: priceId,
                        currentPeriodEnd: endDate,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    },
                    update: {
                        status: subscription.status,
                        plan: tier,
                        priceId: priceId,
                        currentPeriodEnd: endDate,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    }
                });

                await prisma.user.update({
                    where: { id: user.id },
                    data: { tier: tier }
                });
                
                logger.info(`[Webhook] Success: Updated subscription for user ${user.id}`);
                logger.info(`Updated Subscription for User ${user.id} to ${status} (${tier})`);
            } catch (dbError) {
                console.error("[Webhook] Database error updating subscription:", dbError);
                throw dbError; // Re-throw to trigger 500 response
            }
        } else {
            console.warn(`[Webhook] Stripe Customer ${customerId} not found in DB`);
            logger.warn(`Stripe Customer ${customerId} not found in DB`);
        }
        break;
      }
      
      default:
        // Unhandled event type
        logger.warn(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Webhook] Error processing event ${event.type}:`, error);
    logger.error("Error handling webhook event", error);
    return NextResponse.json({ error: "Webhook Handler Error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

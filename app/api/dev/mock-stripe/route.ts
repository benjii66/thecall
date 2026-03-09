import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const { status } = await req.json();

    await prisma.user.update({
      where: { id: userId },
      data: {
        tier: "pro", // Ensure they are Pro to see the banner
        subscription: {
          upsert: {
            create: {
              id: "sub_dev_mock",
              status: status || "past_due",
              plan: "pro",
              priceId: "price_mock",
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
            },
            update: {
              status: status || "past_due"
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: `Mocked subscription status to ${status || "past_due"}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

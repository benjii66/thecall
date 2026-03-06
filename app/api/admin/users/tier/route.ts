import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { userId, tier } = await req.json();

    if (!userId || !["free", "pro"].includes(tier)) {
      console.warn(`[ADMIN_TIER_UPDATE] Invalid parameters received: userId=${userId}, tier=${tier}`);
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    // Log the attempt to update the tier
    console.log(`[ADMIN_TIER_UPDATE] Attempting to update user ${userId} tier to: ${tier}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tier },
    });

    console.log(`[ADMIN_TIER] User ${userId} tier updated to: ${tier}`);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[ADMIN_TIER_UPDATE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

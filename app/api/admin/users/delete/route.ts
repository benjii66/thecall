import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
    }

    // Cascading delete is handled by Prisma schema if configured, 
    // but let's be safe and ensure matches/reports are removed?
    // In our schema, many relations might not have onDelete: Cascade explicitly set in the user's initial setup.
    // Let's perform a manual cleanup of the most important entities to avoid orphaned data.
    
    await prisma.$transaction([
      prisma.coachingReport.deleteMany({
        where: { match: { userId: userId } }
      }),
      prisma.match.deleteMany({
        where: { userId: userId }
      }),
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_USER_DELETE]", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la suppression" }, { status: 500 });
  }
}

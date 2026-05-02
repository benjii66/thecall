import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/security";

export async function POST(req: Request) {
  if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });

  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const deleted = await prisma.coachingReport.deleteMany({});
    return NextResponse.json({ success: true, count: deleted.count });
  } catch (e) {
    console.error("Erreur nettoyage cache IA:", e);
    return NextResponse.json({ error: "Erreur lors du nettoyage" }, { status: 500 });
  }
}

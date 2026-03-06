import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return NextResponse.json({ error: "ID rapport manquant" }, { status: 400 });
    }

    await prisma.coachingReport.delete({
      where: { id: reportId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_REPORT_DELETE]", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la suppression" }, { status: 500 });
  }
}

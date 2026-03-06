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

    // To regenerate, we simply delete the existing report.
    // The next time the user (or admin) visits the coaching view for this match,
    // the system will see it's missing and generate a fresh one.
    
    // Optional: We could trigger a background fetch here if we wanted it to be ready immediately,
    // but simply deleting it is the cleanest "Fix" for cache issues.
    
    await prisma.coachingReport.delete({
      where: { id: reportId }
    });

    // We can also return some metadata about the match to help the UI redirect if needed
    return NextResponse.json({ success: true, message: "Rapport supprimé, prêt pour régénération." });
  } catch (error: any) {
    console.error("[ADMIN_REPORT_REGENERATE]", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la suppression du rapport" }, { status: 500 });
  }
}

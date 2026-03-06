import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import AdminReportsUI from "@/components/AdminReportsUI";

export default async function AdminReportsPage() {
  const session = await verifyAdminSession();
  if (!session) redirect("/admin/login");

  const reports = await prisma.coachingReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      match: {
        include: {
          user: true
        }
      }
    }
  });

  // Serialize dates
  const serializedReports = reports.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    match: {
      ...r.match,
      gameCreation: r.match.gameCreation.toISOString(),
      createdAt: r.match.createdAt.toISOString(),
      user: {
        ...r.match.user,
        createdAt: r.match.user.createdAt.toISOString(),
        updatedAt: r.match.user.updatedAt.toISOString(),
        emailVerified: r.match.user.emailVerified?.toISOString() || null,
        lastCheckedAt: r.match.user.lastCheckedAt?.toISOString() || null,
      }
    }
  }));

  return <AdminReportsUI initialReports={serializedReports as any} />;
}

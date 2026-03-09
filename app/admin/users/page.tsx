import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import AdminUsersUI from "@/components/AdminUsersUI";

export default async function AdminUsersPage() {
  const session = await verifyAdminSession();
  if (!session) redirect("/admin/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { subscription: true }
  });

  // Convert dates to string for serialization
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    emailVerified: user.emailVerified?.toISOString() || null,
    lastCheckedAt: user.lastCheckedAt?.toISOString() || null,
    isFounder: user.subscription?.priceId === process.env.STRIPE_PRICE_ID_MONTHLY_LAUNCH,
    subscription: user.subscription ? {
      ...user.subscription,
      currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
      updatedAt: user.subscription.updatedAt.toISOString(),
    } : null,
  }));

  return <AdminUsersUI initialUsers={serializedUsers as any} />;
}

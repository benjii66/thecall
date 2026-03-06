import { verifyAdminSession } from "@/lib/admin-auth";
import AdminSidebarClient from "@/components/AdminSidebarClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession();

  if (!session) {
    return children; 
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AdminSidebarClient username={session.username} />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}

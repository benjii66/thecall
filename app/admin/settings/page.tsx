import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import AdminSettingsUI from "@/components/AdminSettingsUI";

export default async function AdminSettingsPage() {
  const session = await verifyAdminSession();
  if (!session) redirect("/admin/login");

  return <AdminSettingsUI />;
}

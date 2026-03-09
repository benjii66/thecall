"use client";

import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Users, BarChart3, LogOut, LayoutDashboard, Database, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminSidebarClient({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white">TheCall <span className="text-violet-500">Admin</span></span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <AdminNavLink href="/admin" icon={LayoutDashboard} label="Tableau de bord" active={pathname === "/admin"} />
          <AdminNavLink href="/admin/users" icon={Users} label="Utilisateurs" active={pathname === "/admin/users"} />
          <AdminNavLink href="/admin/reports" icon={Database} label="Rapports IA" active={pathname === "/admin/reports"} />
          <AdminNavLink href="/admin/analytics" icon={BarChart3} label="Statistiques" active={pathname === "/admin/analytics"} />
          <AdminNavLink href="/admin/settings" icon={Settings} label="Paramètres" active={pathname === "/admin/settings"} />
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700" />
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-sm font-medium text-white">{username}</p>
              <p className="text-[10px] text-white/40 italic">Administrateur</p>
            </div>
            <button 
                onClick={handleLogout}
                className="text-white/40 hover:text-white transition-colors"
            >
               <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AdminNavLink({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        active 
          ? "bg-violet-600/10 text-violet-400 shadow-[inset_0_0_15px_rgba(139,92,246,0.05)]" 
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-violet-400" : "text-inherit"}`} />
      {label}
    </Link>
  );
}

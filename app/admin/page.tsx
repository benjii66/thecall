import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Users, FileText, CreditCard, Activity, TrendingUp } from "lucide-react";
import { ThemeSetter } from "@/components/MatchThemeController";
import { BackgroundFX } from "@/components/BackgroundFX";
import { checkSystemHealth } from "@/lib/health";

export default async function AdminDashboardPage() {
  const session = await verifyAdminSession();
  if (!session) redirect("/admin/login");

  // Fetch metrics pipeline
  const [userCount, reportCount, proCount, matchCount, recentUsers, health] = await Promise.all([
    prisma.user.count(),
    prisma.coachingReport.count(),
    prisma.user.count({ where: { tier: 'pro' } }),
    prisma.match.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
          id: true,
          riotGameName: true,
          riotTagLine: true,
          image: true,
          createdAt: true,
          tier: true
      }
    }),
    checkSystemHealth()
  ]);

  return (
    <div className="relative min-h-screen p-8 pt-24 lg:pt-8">
      <ThemeSetter theme="profile" />
      <BackgroundFX />

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-white/50">Surveillance globale des opérations TheCall</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard 
            title="Utilisateurs" 
            value={userCount} 
            icon={Users} 
            color="text-blue-400" 
            bgColor="bg-blue-500/10" 
            borderColor="border-blue-500/20"
          />
          <StatCard 
            title="Rapports IA" 
            value={reportCount} 
            icon={FileText} 
            color="text-violet-400" 
            bgColor="bg-violet-500/10" 
            borderColor="border-violet-500/20"
          />
          <StatCard 
            title="Abonnés Pro" 
            value={proCount} 
            icon={CreditCard} 
            color="text-emerald-400" 
            bgColor="bg-emerald-500/10" 
            borderColor="border-emerald-500/20"
          />
          <StatCard 
            title="Matchs Analysés" 
            value={matchCount} 
            icon={Activity} 
            color="text-cyan-400" 
            bgColor="bg-cyan-500/10" 
            borderColor="border-cyan-500/20"
          />
        </div>

        {/* Recent Sections */}
        <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-semibold tracking-tight">Derniers Utilisateurs</h3>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="space-y-4">
                    {recentUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10 flex items-center justify-center">
                                    {u.image ? <img src={u.image} alt="" className="h-full w-full object-cover" /> : <Users className="h-4 w-4 text-white/30" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{u.riotGameName || "User"}</p>
                                    <p className="text-[10px] text-white/40">{u.tier === 'pro' ? 'PRO' : 'FREE'}</p>
                                </div>
                            </div>
                            <span className="text-[10px] text-white/20">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {recentUsers.length === 0 && <p className="text-center py-10 text-sm text-white/30 italic">Aucun utilisateur.</p>}
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-semibold tracking-tight">Santé Système</h3>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        health.overall 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-red-500/10 text-red-400"
                    }`}>
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health.overall ? "bg-emerald-400" : "bg-red-400"}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${health.overall ? "bg-emerald-500" : "bg-red-500"}`}></span>
                        </span>
                        {health.overall ? "OPÉRATIONNEL" : "DÉGRADÉ"}
                    </div>
                </div>
                <div className="space-y-4">
                    <HealthBar 
                        label="Database (Prisma)" 
                        value={health.database} 
                        description="Vérifie la latence et la connectivité à la base de données PostgreSQL."
                    />
                    <HealthBar 
                        label="OpenAI API" 
                        value={health.openai} 
                        description="État de la clé API et disponibilité du moteur d'analyse GPT-4."
                    />
                    <HealthBar 
                        label="Riot Games API" 
                        value={health.riot} 
                        description="Connectivité aux serveurs Riot. Crucial pour récupérer les matchs."
                    />
                    <HealthBar 
                        label="Redis Cache" 
                        value={health.redis} 
                        description="Performance du cache de session et du rate-limiting."
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, borderColor }: any) {
  return (
    <div className={`rounded-3xl border ${borderColor} ${bgColor} p-6 backdrop-blur-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, value, description }: { label: string, value: number, description: string }) {
    return (
        <div className="group relative space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/60">{label}</span>
                <span className="text-white/40">{value}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-1000" 
                    style={{ width: `${value}%` }} 
                />
            </div>
            {/* Tooltip on hover */}
            <div className="absolute -top-2 left-0 z-20 w-full -translate-y-full rounded-xl border border-white/10 bg-black/90 p-2 text-[10px] text-white/70 opacity-0 backdrop-blur-md transition-all group-hover:translate-y-[-120%] group-hover:opacity-100 pointer-events-none">
                {description}
            </div>
        </div>
    );
}

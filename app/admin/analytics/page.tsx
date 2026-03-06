import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Users, Zap, ArrowUpRight } from "lucide-react";
import { ThemeSetter } from "@/components/MatchThemeController";
import { BackgroundFX } from "@/components/BackgroundFX";

export default async function AdminAnalyticsPage() {
  const session = await verifyAdminSession();
  if (!session) redirect("/admin/login");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all necessary stats
  const [totalUsers, recentReports, usersByTier, dailyUsage] = await Promise.all([
    prisma.user.count(),
    prisma.coachingReport.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    }),
    prisma.user.groupBy({
      by: ['tier'],
      _count: true
    }),
    // Optimized: Fetch all reports from the last 14 days in a single query
    prisma.coachingReport.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true }
    }).then(reports => {
      // Group by day manually to avoid timezone issues/multiple queries
      const countsByDay: Record<string, number> = {};
      reports.forEach(r => {
        const dateKey = r.createdAt.toISOString().split('T')[0];
        countsByDay[dateKey] = (countsByDay[dateKey] || 0) + 1;
      });

      return Array.from({ length: 14 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (13 - i));
        // Use local date string for the key to match human expectations
        const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        return {
          day: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
          count: countsByDay[key] || 0
        };
      });
    })
  ]);

  const proCount = usersByTier.find((g: any) => g.tier === 'pro')?._count || 0;
  const freeCount = usersByTier.find((g: any) => g.tier === 'free')?._count || (totalUsers - proCount);
  const proPercentage = totalUsers > 0 ? (proCount / totalUsers) * 100 : 0;
  const maxCount = Math.max(...dailyUsage.map((d: any) => d.count), 5); // Ensure at least 5 for scaling

  return (
    <div className="relative min-h-screen p-8 pt-24 lg:pt-8 bg-[#020202]">
      <ThemeSetter theme="profile" />
      <BackgroundFX />

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Analytics</h1>
          <p className="text-white/40 font-medium">Performance et croissance de la plateforme</p>
        </div>

        {/* Growth Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all hover:border-emerald-500/30">
             <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Taux de Conversion</p>
             <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-black text-white italic">{proPercentage.toFixed(1)}%</p>
                <span className="text-xs text-emerald-400 flex items-center gap-0.5 font-bold">
                    <ArrowUpRight className="h-3 w-3" />
                    Target 15%
                </span>
             </div>
             <p className="mt-4 text-[10px] text-white/20 italic">Basé sur {proCount} abonnés Pro / {totalUsers} total</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all hover:border-violet-500/30">
             <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Zap className="h-5 w-5" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Activité 7 jours</p>
             <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-black text-white italic">+{recentReports}</p>
                <span className="text-xs text-violet-400 font-bold tracking-tight">Rapports</span>
             </div>
             <p className="mt-4 text-[10px] text-white/20 italic">Moyenne : {(recentReports / 7).toFixed(1)} / jour</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all hover:border-blue-500/30">
             <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="h-5 w-5" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Répartition Tiers</p>
             <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/5 p-[1px]">
                <div 
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]" 
                    style={{ width: `${proPercentage}%` }} 
                    title={`Pro: ${proCount}`}
                />
                <div 
                    className="h-full bg-white/10" 
                    style={{ width: `${100 - proPercentage}%` }} 
                    title={`Free: ${freeCount}`}
                />
             </div>
             <div className="mt-4 flex justify-between text-[11px] font-bold">
                <span className="text-violet-400">PRO: {proCount}</span>
                <span className="text-white/20 uppercase tracking-widest">FREE: {freeCount}</span>
             </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-gray-950 via-gray-950 to-violet-950/10 p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
           
           <div className="mb-12 flex items-center justify-between relative z-10">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Usage de l'Analyse Premium</h3>
                <p className="text-sm text-white/30 font-medium">Volume de rapports générés sur les 14 derniers jours</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-4 mr-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span>Rapports</span>
                  </div>
                </div>
                <button className="rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-[10px] text-white/60 font-bold hover:bg-white/10 transition-colors uppercase tracking-widest">Export</button>
                <div className="rounded-xl bg-violet-600 px-4 py-2 text-[10px] text-white uppercase font-black tracking-widest shadow-xl shadow-violet-600/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </div>
              </div>
           </div>
           
           <div className="flex h-64 w-full items-end gap-3 px-4 relative z-10">
              {dailyUsage.map((data: any, i: number) => {
                const heightVal = (data.count / maxCount) * 100;
                const isToday = i === 13;
                return (
                  <div key={i} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-90 rounded-xl bg-white px-3 py-1.5 text-[11px] font-black text-black opacity-0 transition-all group-hover:-top-14 group-hover:opacity-100 z-20 shadow-2xl pointer-events-none">
                        {data.count} reports
                     </div>
                     
                     <div className="relative w-full h-full flex flex-col justify-end items-center max-w-[40px] mb-6">
                         {/* Background track for the bar */}
                         <div className="absolute bottom-0 w-full h-full bg-white/[0.02] rounded-t-xl" />

                         <div 
                            className={`relative w-full rounded-t-xl ring-1 ring-white/10 transition-all duration-500 z-10 ${
                              isToday 
                                ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]" 
                                : "bg-gradient-to-t from-violet-700 via-violet-600 to-violet-400 group-hover:brightness-125"
                            } ${data.count > 0 ? "opacity-100" : "opacity-30"}`}
                            style={{ height: `${Math.max(heightVal, 4)}%` }} 
                         />
                     </div>
                     <div className="h-6 flex items-center shrink-0">
                        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${
                          isToday ? "text-cyan-400" : "text-white/20 group-hover:text-white/50"
                        }`}>{data.day}</span>
                     </div>
                  </div>
                );
              })}
           </div>
           
           <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
              <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase font-bold italic">Système d'Analyse Cognitive v3.2</p>
              <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <span className="flex items-center gap-2">Max: <span className="text-white">{maxCount}</span></span>
                <span className="flex items-center gap-2">Total: <span className="text-white">{recentReports}</span></span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

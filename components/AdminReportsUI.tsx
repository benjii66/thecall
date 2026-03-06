"use client";

import { useState } from "react";
import { FileCode, Clock, Cpu, Activity, ExternalLink, ChevronDown, ChevronRight, Folder, RefreshCw, Trash2, X } from "lucide-react";
import Link from "next/link";
import { ThemeSetter } from "@/components/MatchThemeController";
import { BackgroundFX } from "@/components/BackgroundFX";

interface Report {
  id: string;
  quality: string;
  modelUsed: string | null;
  version: string;
  createdAt: string;
  reportJson: any; // Added to show pretty JSON
  match: {
    matchId: string;
    user: {
      riotGameName: string | null;
      riotTagLine: string | null;
      id: string;
    }
  }
}

export default function AdminReportsUI({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [processingReports, setProcessingReports] = useState<Record<string, boolean>>({});
  const [viewingJson, setViewingJson] = useState<Report | null>(null);

  // Group by user
  const grouped = reports.reduce((acc, report) => {
    const userId = report.match.user.id;
    if (!acc[userId]) {
        acc[userId] = {
            name: report.match.user.riotGameName || "User Inconnu",
            tag: report.match.user.riotTagLine || "...",
            reports: []
        };
    }
    acc[userId].reports.push(report);
    return acc;
  }, {} as Record<string, { name: string, tag: string, reports: Report[] }>);

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm("Supprimer définitivement ce rapport ?")) return;
    setProcessingReports(prev => ({ ...prev, [reportId]: true }));
    try {
      const res = await fetch("/api/admin/reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId })
      });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== reportId));
      }
    } catch (e) {
      alert("Erreur lors de la suppression");
    } finally {
      setProcessingReports(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const regenerateReport = async (reportId: string) => {
    if (!confirm("Voulez-vous supprimer ce rapport et forcer une nouvelle analyse lors de la prochaine visite ?")) return;
    setProcessingReports(prev => ({ ...prev, [reportId]: true }));
    try {
      const res = await fetch("/api/admin/reports/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId })
      });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== reportId));
        alert("Rapport réinitialisé. Il sera régénéré au prochain accès coaching du match.");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setProcessingReports(prev => ({ ...prev, [reportId]: false }));
    }
  };

  return (
    <div className="relative min-h-screen p-8 pt-24 lg:pt-8">
      <ThemeSetter theme="profile" />
      <BackgroundFX />

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Rapports IA</h1>
          <p className="text-white/50">Audit des analyses par joueur</p>
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([userId, data]) => {
            const isExpanded = expandedUsers[userId];
            return (
              <div key={userId} className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all">
                <button 
                  onClick={() => toggleUser(userId)}
                  className="flex w-full items-center justify-between p-6 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400">
                        <Folder className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white">{data.name} <span className="text-white/30 text-sm font-normal">#{data.tag}</span></h3>
                        <p className="text-xs text-white/40">{data.reports.length} rapports générés</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="text-white/40" /> : <ChevronRight className="text-white/40" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 px-6 pb-6 pt-2 space-y-4">
                    {data.reports.map((report) => (
                        <div key={report.id} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-violet-500/30">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-3.5 w-3.5 text-violet-400" />
                                        <span className="text-xs font-bold text-white uppercase tracking-tight">Analyse {report.quality}</span>
                                        <span className="text-[10px] text-white/30">• v{report.version}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-[10px] text-white/50">
                                        <div className="flex items-center gap-1.5">
                                            <Activity className="h-3 w-3 text-cyan-400" />
                                            <span>{report.match.matchId}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3 w-3 text-emerald-400" />
                                            <span>{new Date(report.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-white/30 italic">Modèle : {report.modelUsed || "Inconnu"}</div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button 
                                      onClick={() => setViewingJson(report)}
                                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <FileCode className="h-3 w-3" />
                                        JSON
                                    </button>
                                    <button 
                                      onClick={() => regenerateReport(report.id)}
                                      disabled={processingReports[report.id]}
                                      title="Supprimer pour forcer la régénération"
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors hover:bg-amber-500 hover:text-white disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${processingReports[report.id] ? "animate-spin" : ""}`} />
                                    </button>
                                    <Link 
                                        href={`/match?matchId=${report.match.matchId}&tab=coach`}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 transition-colors hover:bg-violet-600 hover:text-white"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                    <button 
                                      onClick={() => deleteReport(report.id)}
                                      disabled={processingReports[report.id]}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pretty JSON Modal */}
      {viewingJson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingJson(null)}></div>
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gray-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Export Rapport IA</h3>
                <p className="text-xs text-white/40">Match: {viewingJson.match.matchId}</p>
              </div>
              <button onClick={() => setViewingJson(null)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl bg-black/60 p-6 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
               <pre className="whitespace-pre-wrap break-all">
                 {JSON.stringify(viewingJson.reportJson, null, 2).split('\n').map((line, i) => {
                   // basic regex-less syntax highlighting for common patterns
                   let colorClass = "text-blue-300"; // default for values
                   if (line.includes('":')) colorClass = "text-violet-400"; // keys
                   if (line.includes('null') || line.includes('true') || line.includes('false')) colorClass = "text-amber-500";
                   if (/\d+/.test(line) && !line.includes('"')) colorClass = "text-cyan-400"; // numbers

                   return (
                     <div key={i} className={colorClass}>
                       {line}
                     </div>
                   );
                 })}
               </pre>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(viewingJson.reportJson, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `report_${viewingJson.match.matchId}.json`;
                  a.click();
                }}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Folder className="h-3.5 w-3.5" />
                Télécharger .json
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

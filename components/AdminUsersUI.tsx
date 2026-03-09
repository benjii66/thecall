"use client";

import { useState } from "react";
import { Search, UserCircle, ExternalLink, Shield, ShieldAlert, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { ThemeSetter } from "@/components/MatchThemeController";
import { BackgroundFX } from "@/components/BackgroundFX";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  riotGameName: string | null;
  riotTagLine: string | null;
  riotPuuid: string | null;
  tier: string | null;
  status: string | null;
  createdAt: string;
  subscription?: {
    status: string;
    stripeCustomerId: string;
    currentPeriodEnd: string | null;
  } | null;
  isFounder?: boolean;
}

export default function AdminUsersUI({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingTiers, setLoadingTiers] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
  const [deletingUsers, setDeletingUsers] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleTier = async (userId: string, currentTier: string) => {
    const nextTier = currentTier === "pro" ? "free" : "pro";
    console.log(`[ADMIN_UI] Toggling tier for user ${userId}: ${currentTier} -> ${nextTier}`);
    setLoadingTiers(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await fetch("/api/admin/users/tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier: nextTier }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, tier: nextTier } : u));
      }
    } catch (err) {
      console.error("Failed to update tier", err);
    } finally {
      setLoadingTiers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "inactive" ? "active" : "inactive";
    setLoadingStatuses(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setLoadingStatuses(prev => ({ ...prev, [userId]: false }));
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Es-tu SÛR de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera tous ses matchs et rapports.")) return;
    
    setDeletingUsers(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert("Erreur: " + (err.error || "Inconnu"));
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setDeletingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter(u => 
    u.riotGameName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.riotPuuid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen p-8 pt-24 lg:pt-8">
      <ThemeSetter theme="profile" />
      <BackgroundFX />

      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Utilisateurs</h1>
            <p className="text-white/50">Gestion de la base de données utilisateurs</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-violet-500/50"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-white/40">
                <tr>
                   <th className="px-6 py-4">Utilisateur</th>
                   <th className="px-6 py-4">Accès / Tier</th>
                   <th className="px-6 py-4">Expiration</th>
                   <th className="px-6 py-4">Inscrit le</th>
                   <th className="px-6 py-4">PUUID</th>
                   <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10">
                          {user.image ? (
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-violet-600/20 text-violet-400">
                                <UserCircle className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.riotGameName || user.name || "Inconnu"}</p>
                          <p className="text-[10px] text-white/40">#{user.riotTagLine || "..."}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {/* Status Toggle (Account Access) */}
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[9px] text-white/20 uppercase font-black" title="Bloque la connexion au compte, sans affecter l'abonnement en cours.">Accès :</span>
                          <button
                            onClick={() => toggleStatus(user.id, user.status || "active")}
                            disabled={loadingStatuses[user.id]}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase transition-all w-28 ${
                              user.status === 'inactive' 
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" 
                                : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            }`}
                            title={user.status === 'inactive' ? 'Réactiver le compte' : 'Suspendre (Bloquer la connexion)'}
                          >
                            {loadingStatuses[user.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.status === 'inactive' ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <UserX className="h-3 w-3" />
                            )}
                            <span>{user.status === 'inactive' ? 'Réactiver' : 'Bloquer'}</span>
                          </button>
                        </div>

                        {/* Tier Toggle (Subscription Level) */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[9px] text-white/20 uppercase font-black" title="Niveau d'abonnement du compte. Influe sur les analyses mensuelles.">Tier :</span>
                            <button
                              onClick={() => toggleTier(user.id, user.tier || "free")}
                              disabled={loadingTiers[user.id]}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase transition-all w-32 ${
                                user.tier === 'pro' 
                                  ? (user.subscription?.status === 'active' 
                                      ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                                      : "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]")
                                  : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white"
                              }`}
                              title={user.tier === 'pro' ? 'Rétrograder en Gratuit' : 'Forcer Premium manuellement (Anti Stripe Error)'}
                            >
                              {loadingTiers[user.id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : user.tier === 'pro' ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <ShieldAlert className="h-3 w-3" />
                              )}
                              <span>
                                {user.tier === 'pro' 
                                  ? (user.subscription?.status === 'active' 
                                       ? (user.isFounder ? 'Fondateur' : 'Stripe Pro') 
                                       : 'Pro Manuel') 
                                  : 'Gratuit'}
                              </span>
                            </button>
                          </div>
                          
                          {/* Explications visuelles */}
                          {user.tier === 'pro' && !user.subscription?.status && (
                             <p className="text-[8px] text-violet-400/60 uppercase tracking-widest text-right pr-1">Accès forcé</p>
                          )}
                          {user.tier === 'pro' && user.subscription?.status === 'active' && user.isFounder && (
                             <p className="text-[8px] text-amber-500/80 uppercase tracking-widest text-right pr-1">Early Adopter</p>
                          )}
                          {user.tier === 'pro' && user.subscription?.status === 'active' && !user.isFounder && (
                             <p className="text-[8px] text-blue-400/60 uppercase tracking-widest text-right pr-1">Géré par Stripe</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.subscription?.currentPeriodEnd ? (
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          {new Date(user.subscription.currentPeriodEnd).getTime() < Date.now() ? (
                            <span className="text-[10px] text-red-400 uppercase font-bold">Expiré</span>
                          ) : (
                            <span className="text-[10px] text-white/30 uppercase">Actif</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/20">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/60 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                       <code className="text-[10px] text-white/30 truncate max-w-[120px] block" title={user.riotPuuid || ""}>
                         {user.riotPuuid || "N/A"}
                       </code>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/profile?puuid=${user.riotPuuid}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => deleteUser(user.id)}
                          disabled={deletingUsers[user.id]}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                        >
                          {deletingUsers[user.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

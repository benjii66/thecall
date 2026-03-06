"use client";

import { useState, useEffect } from "react";
import { User, Shield, Bell, Palette, Globe, LogOut, Loader2, Save, AlertCircle, CreditCard, Zap, Info } from "lucide-react";
import { ThemeSetter } from "@/components/MatchThemeController";
import { TIER_LIMITS } from "@/types/pricing";

export function PublicSettingsUI() {
  const [activeTab, setActiveTab] = useState("compte");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        setSaveStatus("success");
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const handleStripePortal = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Impossible d'ouvrir le portail de paiement.");
      }
    } catch (e) {
      alert("Erreur réseau lors de la redirection Stripe.");
    } finally {
      setSaving(false);
    }
  };

  const handleStripeCheckout = () => {
    window.location.href = "/pricing";
  };

  const tabs = [
    { id: "compte", label: "Compte", icon: User },
    { id: "abonnement", label: "Abonnement", icon: CreditCard },
    { id: "preferences", label: "Préférences", icon: Palette },
    { id: "securite", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-32">
       <ThemeSetter theme="profile" />
       
       <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Sidebar Nav */}
          <div className="w-full md:w-64 space-y-2">
             <h1 className="px-4 text-2xl font-bold text-white mb-6">Paramètres</h1>
             {tabs.map((tab) => (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      activeTab === tab.id 
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" 
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                   }`}
                >
                   <tab.icon className="h-4 w-4" />
                   {tab.label}
                </button>
             ))}
             
             <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transiton-all mt-8"
             >
                <LogOut className="h-4 w-4" />
                Déconnexion
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
             <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">Gère ton compte et tes préférences TheCall.</p>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2 text-sm font-bold text-white hover:bg-violet-500 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saveStatus === "success" ? "Enregistré !" : "Sauvegarder"}
                </button>
             </div>

             {saveStatus === "error" && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 animate-in fade-in zoom-in duration-300">
                    <AlertCircle className="h-4 w-4" />
                    Erreur lors de la sauvegarde. Réessaye.
                </div>
             )}

             {activeTab === "compte" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <Section title="Informations Personnelles">
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">Prénom / Pseudo</label>
                            <input 
                               type="text" 
                               value={user?.name || ""} 
                               disabled
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/60 cursor-not-allowed"
                            />
                         </div>
                         <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">Email</label>
                            <input 
                               type="email" 
                               value={user?.email || ""} 
                               disabled
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/60 cursor-not-allowed"
                            />
                         </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[10px] text-white/20 italic">
                        <Info className="h-3 w-3" />
                        <span>Ces informations sont synchronisées via Riot Games et ne peuvent pas être modifiées manuellement.</span>
                      </div>
                   </Section>

                   <Section title="Lien Riot Games">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
                               <Globe className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">Compte Riot Connecté</p>
                               <p className="text-xs text-white/40">{user?.riotGameName}#{user?.riotTagLine}</p>
                            </div>
                         </div>
                         <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/30">Tier: {user?.tier?.toUpperCase()}</div>
                      </div>
                   </Section>
                </div>
             )}

              {activeTab === "abonnement" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <Section title="Ton Plan Actuel">
                      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-transparent border border-violet-500/20">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               {user?.tier === 'pro' && <Zap className="h-5 w-5 text-violet-400 fill-violet-400/20" />}
                               <h4 className="text-xl font-black text-white italic uppercase">{user?.tier === 'pro' ? 'TheCall Pro' : 'Plan Gratuit'}</h4>
                               {user?.tier === 'pro' && <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">Membre Actif</div>}
                            </div>
                            <p className="text-sm text-white/40">
                               {user?.tier === 'pro' 
                                 ? 'Tu bénéficies de toutes les analyses premium illimitées.' 
                                 : `Limite de ${TIER_LIMITS['free'].coachingPerMonth} analyses par mois. Passe à Pro pour ne plus rien rater.`}
                            </p>
                         </div>
                         {user?.tier !== 'pro' && (
                            <button 
                               onClick={handleStripeCheckout}
                               className="rounded-xl bg-violet-600 px-6 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/30"
                            >
                               Passer à Pro
                            </button>
                         )}
                      </div>
                   </Section>

                   {(user?.subscription || user?.tier === 'pro') && (
                     <Section title="Détails de Facturation">
                        <div className="grid gap-4 sm:grid-cols-2">
                           <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Statut</p>
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-bold text-white uppercase">
                                  {user?.subscription 
                                     ? (user.isFounder ? 'Membre Fondateur' : user.subscription.status) 
                                     : 'Forcé (Sans Stripe)'}
                                </p>
                                {user?.isFounder && (
                                   <p className="text-[10px] text-amber-500/80 italic normal-case">Merci d'avoir soutenu TheCall au lancement ! 💜</p>
                                )}
                              </div>
                           </div>
                           <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Renouvellement</p>
                              <p className="text-sm font-bold text-white">
                                 {user?.subscription?.currentPeriodEnd 
                                   ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() 
                                   : 'Géré par un Administrateur'}
                              </p>
                           </div>
                        </div>
                        {user?.subscription?.status && user.subscription.status !== 'canceled' && (
                          <button 
                             onClick={handleStripePortal}
                             disabled={saving}
                             className="mt-6 text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                             <CreditCard className="h-3 w-3" />
                             Gérer mon abonnement via Stripe
                          </button>
                        )}
                     </Section>
                   )}

                   <Section title="Utilisation">
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                               <span className="text-white/40">Analyses ce mois</span>
                               <span className="text-white">
                                 {user?.usage?.monthlyCount || 0} / {user?.tier === 'pro' ? '∞' : TIER_LIMITS['free'].coachingPerMonth}
                               </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${user?.tier === 'pro' ? 'bg-emerald-500' : 'bg-violet-500'}`} 
                                 style={{ 
                                   width: user?.tier === 'pro' 
                                     ? '100%' 
                                     : `${Math.min(((user?.usage?.monthlyCount || 0) / TIER_LIMITS['free'].coachingPerMonth) * 100, 100)}%` 
                                 }}
                               />
                            </div>
                         </div>
                      </div>
                   </Section>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <Section title="Interface & Look">
                      <div className="space-y-4">
                         <ToggleOption 
                            title="Thème Dynamique" 
                            description="L'interface adapte ses teintes (Victoire, Défaite ou Neutre) en fonction du résultat de tes matchs."
                            checked={user?.themeDynamic}
                            onChange={(val) => setUser({ ...user, themeDynamic: val })}
                         />
                         <ToggleOption 
                            title="Animations Avancées" 
                            description="Active les transitions fluides, les effets de particules et les micro-interactions pour une expérience plus immersive et premium."
                            checked={user?.animationsEnabled}
                            onChange={(val) => setUser({ ...user, animationsEnabled: val })}
                         />
                      </div>
                   </Section>

                   <Section title="Langue">
                      <select 
                        value={user?.language}
                        onChange={(e) => setUser({ ...user, language: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500/50 outline-none transition-all appearance-none cursor-pointer"
                      >
                         <option value="fr">Français (France)</option>
                         <option value="en">English (UK)</option>
                         <option value="us">English (US)</option>
                      </select>
                   </Section>
                </div>
             )}

             {activeTab === "securite" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <Section title="Mot de Passe">
                      <button className="w-full bg-white/5 text-white/40 rounded-xl py-3 text-sm font-bold border border-white/5 hover:bg-white/10 transition-all cursor-not-allowed">
                         Changement de mot de passe (Indisponible pour le moment)
                      </button>
                   </Section>
                   
                   <Section title="Confidentialité">
                      <ToggleOption 
                         title="Profil Public" 
                         description="Permet aux autres joueurs de voir tes statistiques et rapports."
                         checked={user?.isPublic}
                         onChange={(val) => setUser({ ...user, isPublic: val })}
                      />
                   </Section>
                </div>
             )}

             {activeTab === "notifications" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <Section title="Canaux">
                      <div className="space-y-4">
                         <ToggleOption 
                            title="Notifications Push" 
                            description="Alerte quand un nouveau rapport est prêt."
                            checked={user?.pushNotifications}
                            onChange={(val) => setUser({ ...user, pushNotifications: val })}
                         />
                         <ToggleOption 
                            title="Newsletter & Conseils" 
                            description="Reçois les meilleures astuces hebdomadaires par email."
                            checked={user?.emailNewsletter}
                            onChange={(val) => setUser({ ...user, emailNewsletter: val })}
                         />
                      </div>
                   </Section>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
       <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-6">{title}</h3>
       {children}
    </div>
  );
}

function ToggleOption({ title, description, checked, onChange }: { title: string, description: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
       <div className="space-y-1 pr-4">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-white/40">{description}</p>
       </div>
       <div 
          onClick={() => onChange(!checked)}
          className={`h-5 w-10 rounded-full cursor-pointer transition-all relative shrink-0 ${checked ? 'bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-white/10'}`}>
          <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
       </div>
    </div>
  );
}

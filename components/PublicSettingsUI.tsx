"use client";

import { useState, useEffect } from "react";
import { User, Shield, Bell, Palette, Globe, LogOut, Loader2, Save, AlertCircle, CreditCard, Zap, Info, ChevronDown, Check } from "lucide-react";
import { ThemeSetter } from "@/components/MatchThemeController";
import { TIER_LIMITS } from "@/types/pricing";
import { useLanguage } from "@/lib/language";

export function PublicSettingsUI() {
  const [activeTab, setActiveTab] = useState("compte");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [langOpen, setLangOpen] = useState(false);
  const { setLanguage, t } = useLanguage();

  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        setUser(data);
        if (data.language) setLanguage(data.language);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setLanguage]);

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
    { id: "compte", label: t("settings.tabs.account"), icon: User },
    { id: "abonnement", label: t("settings.tabs.subscription"), icon: CreditCard },
    { id: "preferences", label: t("settings.tabs.preferences"), icon: Palette },
    { id: "securite", label: t("settings.tabs.security"), icon: Shield },
    { id: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
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
             <h1 className="px-4 text-2xl font-bold text-white mb-6">{t("settings.title")}</h1>
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
                {t("settings.logout")}
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
             <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">{t("settings.subtitle")}</p>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2 text-sm font-bold text-white hover:bg-violet-500 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saveStatus === "success" ? t("settings.saved") : t("settings.save")}
                </button>
             </div>

             {saveStatus === "error" && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 animate-in fade-in zoom-in duration-300">
                    <AlertCircle className="h-4 w-4" />
                    {t("settings.saveError")}
                </div>
             )}

             {activeTab === "compte" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <Section title={t("settings.personalInfo")}>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">{t("settings.name")}</label>
                            <input 
                               type="text" 
                               value={user?.name || ""} 
                               disabled
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/60 cursor-not-allowed"
                            />
                         </div>
                         <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">{t("settings.email")}</label>
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
                         <span>{t("settings.personalInfoDesc")}</span>
                      </div>
                   </Section>

                   <Section title={t("settings.riotLink")}>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
                               <Globe className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">{t("settings.riotConnected")}</p>
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
                   <Section title={t("settings.plan.title")}>
                      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-transparent border border-violet-500/20">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               {user?.tier === 'pro' && <Zap className="h-5 w-5 text-violet-400 fill-violet-400/20" />}
                               <h4 className="text-xl font-black text-white italic uppercase">{user?.tier === 'pro' ? t("settings.plan.pro") : t("settings.plan.free")}</h4>
                                {user?.tier === 'pro' && <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">{t("settings.plan.active")}</div>}
                            </div>
                            <p className="text-sm text-white/40">
                               {user?.tier === 'pro' 
                                 ? t("settings.plan.proDesc") 
                                 : t("settings.plan.freeDesc", { count: TIER_LIMITS['free'].coachingPerMonth.toString() })}
                            </p>
                         </div>
                         {user?.tier !== 'pro' && (
                            <button 
                               onClick={handleStripeCheckout}
                               className="rounded-xl bg-violet-600 px-6 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/30"
                            >
                               {t("settings.plan.upgrade")}
                            </button>
                         )}
                      </div>
                   </Section>

                   {(user?.subscription || user?.tier === 'pro') && (
                     <Section title={t("settings.billing.title")}>
                        <div className="grid gap-4 sm:grid-cols-2">
                           <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                               <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t("settings.billing.status")}</p>
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-bold text-white uppercase">
                                  {user?.subscription 
                                     ? (user.isFounder ? t("settings.billing.founder") : user.subscription.status) 
                                     : 'Forcé (Sans Stripe)'}
                                </p>
                                {user?.isFounder && (
                                   <p className="text-[10px] text-amber-500/80 italic normal-case">{t("settings.billing.founderThanks")}</p>
                                )}
                              </div>
                           </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                               <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t("settings.billing.renewal")}</p>
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-bold text-white">
                                   {user?.subscription?.currentPeriodEnd 
                                     ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() 
                                     : t("settings.billing.adminManaged")}
                                </p>
                                {user?.subscription?.cancelAtPeriodEnd && (
                                   <p className="text-[10px] text-red-400/80 font-bold uppercase">{t("settings.billing.cancelNotice")}</p>
                                )}
                              </div>
                           </div>
                        </div>
                        {user?.subscription?.status && user.subscription.status !== 'canceled' && (
                          <button 
                             onClick={handleStripePortal}
                             disabled={saving}
                             className="mt-6 text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                             <CreditCard className="h-3 w-3" />
                              {t("settings.billing.manage")}
                          </button>
                        )}
                     </Section>
                   )}

                   <Section title={t("settings.usage.title")}>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                               <span className="text-white/40">{t("settings.usage.analyses")}</span>
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
                   <Section title={t("settings.look.title")}>
                      <div className="space-y-4">
                         <ToggleOption 
                            title={t("settings.look.dynamicTheme")} 
                            description={t("settings.look.dynamicThemeDesc")}
                            checked={user?.themeDynamic}
                            onChange={(val) => setUser({ ...user, themeDynamic: val })}
                         />
                         <ToggleOption 
                            title={t("settings.look.animations")} 
                            description={t("settings.look.animationsDesc")}
                            checked={user?.animationsEnabled}
                            onChange={(val) => setUser({ ...user, animationsEnabled: val })}
                         />
                      </div>
                   </Section>

                   <Section title={t("settings.language")}>
                      <div className="relative">
                         <p className="text-xs text-white/40 mb-3">{t("settings.languageDesc")}</p>
                         <button 
                            onClick={() => setLangOpen(!langOpen)}
                            className="flex w-full items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/10 transition-all outline-none"
                         >
                            <span>
                               {user?.language === 'fr' ? 'Français (France)' : 
                                (user?.language === 'en' || user?.language === 'us') ? 'English' : t("common.select")}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                         </button>

                         {langOpen && (
                            <>
                               <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setLangOpen(false)} 
                               />
                               <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#120f1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                                  {[
                                     { value: 'fr', label: 'Français (France)' },
                                     { value: 'en', label: 'English' }
                                  ].map((opt) => (
                                     <button
                                        key={opt.value}
                                        onClick={() => {
                                           setUser({ ...user, language: opt.value });
                                           setLanguage(opt.value as any);
                                           setLangOpen(false);
                                        }}
                                        className="flex w-full items-center justify-between px-4 py-3 text-sm text-white/80 hover:bg-violet-600 hover:text-white transition-all text-left"
                                     >
                                        {opt.label}
                                        {user?.language === opt.value && <Check className="h-3 w-3 text-white" />}
                                     </button>
                                  ))}
                               </div>
                            </>
                         )}
                      </div>
                   </Section>
                </div>
              )}

              {activeTab === "securite" && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Section title={t("settings.security.password")}>
                       <button className="w-full bg-white/5 text-white/40 rounded-xl py-3 text-sm font-bold border border-white/5 hover:bg-white/10 transition-all cursor-not-allowed">
                          {t("settings.security.unavailable")}
                       </button>
                    </Section>
                    
                    <Section title={t("settings.privacy.title")}>
                       <ToggleOption 
                          title={t("settings.privacy.public")} 
                          description={t("settings.privacy.publicDesc")}
                          checked={user?.isPublic}
                          onChange={(val) => setUser({ ...user, isPublic: val })}
                       />
                    </Section>
                 </div>
              )}

              {activeTab === "notifications" && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Section title={t("settings.notifications.channels")}>
                       <div className="space-y-4">
                          <ToggleOption 
                             title={t("settings.notifications.push")} 
                             description={t("settings.notifications.pushDesc")}
                             checked={user?.pushNotifications}
                             onChange={(val) => setUser({ ...user, pushNotifications: val })}
                          />
                          <ToggleOption 
                             title={t("settings.notifications.newsletter")} 
                             description={t("settings.notifications.newsletterDesc")}
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

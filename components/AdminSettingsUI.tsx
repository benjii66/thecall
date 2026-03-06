"use client";

import { useState, useEffect } from "react";
import { Save, Key, AlertCircle, CheckCircle2, Loader2, Info, Activity, Database, Trash2 } from "lucide-react";
import { ThemeSetter } from "@/components/MatchThemeController";
import { BackgroundFX } from "@/components/BackgroundFX";

export default function AdminSettingsUI() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        data.settings.forEach((s: any) => map[s.key] = s.value);
        setSettings(map);
      }
    } catch (e) {
      console.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    if (!value) return;
    setSaving(key);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${key} mis à jour avec succès.` });
        await fetchSettings();
      } else {
        setMessage({ type: 'error', text: "Erreur lors de la mise à jour." });
      }
    } catch (e) {
      setMessage({ type: 'error', text: "Erreur réseau." });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-8 pt-24 lg:pt-8">
      <ThemeSetter theme="profile" />
      <BackgroundFX />

      <div className="relative z-10 mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Paramètres Système</h1>
          <p className="text-white/50">Gestion des clés API et configuration critique</p>
        </div>

        {message && (
          <div className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur-xl ${
            message.type === 'success' 
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid gap-6">
          <SettingCard 
            title="Riot Games API Key"
            description="Utilisée pour récupérer les données de match et le statut des joueurs. Prioritaire sur RIOT_API_KEY dans .env."
            currentValue={settings["RIOT_API_KEY"]}
            onSave={(val: string) => handleUpdate("RIOT_API_KEY", val)}
            isSaving={saving === "RIOT_API_KEY"}
          />

          <SettingCard 
            title="OpenAI API Key"
            description="Utilisée pour les analyses de coaching automatiques (gpt-4o-mini). Prioritaire sur OPENAI_API_KEY dans .env."
            currentValue={settings["OPENAI_API_KEY"]}
            onSave={(val: string) => handleUpdate("OPENAI_API_KEY", val)}
            isSaving={saving === "OPENAI_API_KEY"}
          />
        </div>

        <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-blue-400 flex gap-3">
           <Info className="h-5 w-5 shrink-0" />
           <p className="text-[11px] leading-relaxed">
             <strong>Note sur la sécurité :</strong> Les clés sauvegardées ici sont stockées de manière chiffrée en transit mais visibles par quiconque ayant accès à cette interface d'administration. Si aucune clé n'est définie ici, le système utilisera les variables d'environnement définies lors du déploiement.
           </p>
        </div>

        <div className="mt-12 space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-red-400" />
              Opérations de maintenance
            </h2>
            <p className="text-sm text-white/50">Actions directes sur la base de données</p>
          </div>
          
          <div className="rounded-3xl border border-red-500/20 bg-black/40 p-6 backdrop-blur-xl transition-all">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  Vider le Cache IA (Rapports)
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-md">
                  Supprime tous les rapports de coaching de la base de données. 
                  Cela forcera l'IA à regénérer les rapports la prochaine fois qu'un utilisateur consultera l'analyse de sa partie.
                </p>
              </div>
              <button 
                onClick={async () => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer TOUS les rapports de coaching en cache ? Cette action est irréversible.")) {
                    const res = await fetch("/api/admin/cache/clear", { method: "POST" });
                    if (res.ok) {
                      const data = await res.json();
                      alert(`Cache nettoyé avec succès. ${data.count} rapports supprimés.`);
                    } else {
                      alert("Erreur lors du nettoyage du cache.");
                    }
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-6 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-500/20 border border-red-500/20 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                Vider le Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingCardProps {
  title: string;
  description: string;
  currentValue?: string;
  onSave: (val: string) => void;
  isSaving: boolean;
}

function SettingCard({ title, description, currentValue, onSave, isSaving }: SettingCardProps) {
  const [val, setVal] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, message?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const endpoint = title.includes("Riot") ? "/api/admin/test/riot" : "/api/admin/test/openai";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: val }) // Test with new value or environment if empty
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.error });
    } catch (e) {
      setTestResult({ success: false, message: "Erreur réseau" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all hover:border-white/20">
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-violet-400" />
            {title}
          </h3>
          <p className="text-xs text-white/40">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            {currentValue && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                Configurée: {currentValue}
            </span>
            )}
            {testResult && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                    testResult.success 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                    {testResult.success ? "Connexion OK" : `Erreur: ${testResult.message}`}
                </span>
            )}
        </div>
      </div>

      <div className="flex gap-2">
        <input 
          type="password"
          placeholder="Entrer la nouvelle clé..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
        />
        <button 
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
          title="Tester la connexion"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          Test
        </button>
        <button 
          onClick={() => {
            onSave(val);
            setVal("");
            setTestResult(null);
          }}
          disabled={!val || isSaving}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-50 shadow-lg shadow-violet-600/20"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sauvegarder
        </button>
      </div>
    </div>
  );
}

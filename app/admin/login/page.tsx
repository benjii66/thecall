"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackgroundFX } from "@/components/BackgroundFX";
import { ThemeSetter } from "@/components/MatchThemeController";
import { Lock, ShieldCheck, Terminal as TerminalIcon, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Identifiants invalides");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      <ThemeSetter theme="profile" />
      <BackgroundFX />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <ShieldCheck className="h-8 w-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Control Room</h1>
          <p className="mt-2 text-sm text-white/50">
            Interface sécurisée de gestion pour TheCall
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                Pseudo Administrateur
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-violet-500/50 focus:bg-white/10"
                  placeholder="Pseudo"
                  required
                />
                <TerminalIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                Mot de Passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-violet-500/50 focus:bg-white/10"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-violet-600 py-3 text-sm font-bold transition-all hover:bg-violet-500 disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? "Vérification..." : "Accéder au Terminal"}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-white/20">
          Système restreint. Toute tentative d'accès non autorisée est enregistrée.
        </p>
      </div>
    </main>
  );
}

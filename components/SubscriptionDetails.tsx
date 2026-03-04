"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar } from "lucide-react";

export function SubscriptionDetails() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        setSub(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Impossible d'accéder au portail. Vérifiez que vous avez un abonnement actif ou un historique.");
        setPortalLoading(false);
      }
    } catch (e) {
      console.error(e);
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin text-white/40" />
      </div>
    );
  }

  const isPro = sub?.plan === "pro";
  const status = sub?.status;
  const renewalDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white/5 p-4 border border-white/5">
        <div>
          <div className="text-sm text-white/40 uppercase tracking-wider font-semibold mb-1">
            Plan Actuel
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${isPro ? "text-cyan-300" : "text-white"}`}>
              {isPro ? "Pro Tier (Founders)" : "Free Tier"}
            </span>
            {status === "active" && (
               <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                 Actif
               </span>
            )}
            {status === "canceled" && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/20">
                  Annulé
                </span>
             )}
          </div>
        </div>

        {isPro ? (
            <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition disabled:opacity-50"
            >
            {portalLoading ? <Loader2 size={16} className="animate-spin" /> : <SettingsIcon size={16} />}
            <span>Gérer l'abonnement</span>
            </button>
        ) : (
             <a
              href="/pricing"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 text-sm font-bold transition"
            >
              Passer Pro
            </a>
        )}
      </div>

      {isPro && renewalDate && (
        <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
          <Calendar size={18} className="text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-100 font-medium">Prochain renouvellement</p>
            <p className="text-blue-200/60">
                {sub?.cancelAtPeriodEnd 
                    ? `Votre abonnement se terminera le ${renewalDate}.`
                    : `Votre abonnement sera renouvelé automatiquement le ${renewalDate}.`
                }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsIcon({ size }: { size: number }) {
    // Simple gear icon re-implementation or import
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74fa.5.5.5-1-1.72l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
}

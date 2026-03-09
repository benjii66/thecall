"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

export function SubscriptionWarningBanner() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tier")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription?.status) {
          setStatus(data.subscription.status);
        }
      })
      .catch((e) => console.error("Failed to check subscription status", e));
  }, []);

  if (status !== "past_due" && status !== "unpaid") {
    return null;
  }

  const handlePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-red-950/80 backdrop-blur-md border-b border-red-500/30 px-4 py-2 text-center text-sm font-medium text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
        <span className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Action Requise : Le dernier paiement de votre abonnement The Call Pro a échoué.</span>
        </span>
        <button 
            onClick={handlePortal}
            className="flex-shrink-0 whitespace-nowrap rounded-md bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 ring-1 ring-inset ring-red-500/50 hover:bg-red-500/30 transition shadow-[0_0_10px_rgba(239,68,68,0.3)]"
        >
          Mettre à jour mon paiement
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";

export function DemoPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const res = await fetch("/api/config/demo");
        const data = await res.json();
        
        if (data.demoMode) {
          const hasDismissed = sessionStorage.getItem("demoPopupDismissed");
          if (!hasDismissed) {
            setIsVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      } catch (e) {
        console.warn("Failed to fetch demo mode status");
      }
    };
    
    checkDemoMode();
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("demoPopupDismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="relative bg-blue-900/90 text-blue-100 p-4 pr-10 rounded-lg shadow-xl border border-blue-500/50 backdrop-blur-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
        <button 
          onClick={dismiss}
          className="absolute top-3 right-3 text-blue-300 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1">Mode Démo Restreint</h3>
            <p className="text-sm text-blue-200/90 leading-relaxed">
              Le site est actuellement en cours de validation par Riot Games. 
              Par mesure de sécurité, <strong>les modifications de profil et la facturation (Stripe) sont désactivées.</strong> L'IA peut également être limitée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "./SkeletonLoader";
import { PoroLoader } from "./PoroLoader";

const LOADING_MESSAGES = [
  "Analyse de la vision...",
  "Calcul du win rate...",
  "Caresses aux Poros...",
  "Débriefing avec les sbires...",
  "Replay du Nashor throw...",
  "Vérification des smites...",
  "Inspection des runes...",
  "Jugement du build...",
];

/**
 * Skeleton pour l'onglet Coach pendant le chargement
 */
export function CoachTabSkeleton() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Simuler une progression sur 20-25s (durée moyenne du call OpenAI)
    const duration = 20000; 
    const interval = 100;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Bloquer à 95% jusqu'à la fin réelle
        return prev + step;
      });
    }, interval);

    // Changer de message toutes les 3s
    const msgTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, []);

  return (
    <div className="space-y-8">
      <PoroLoader 
        message={LOADING_MESSAGES[messageIndex]} 
        progress={progress} 
      />

      <div className="space-y-6 opacity-50 blur-[2px] transition-all duration-1000">


          {/* Turning Point Skeleton */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <Skeleton variant="text" width="30%" height={24} className="mb-4" />
            <Skeleton variant="text" width="100%" height={16} className="mb-2" />
            <Skeleton variant="text" width="80%" height={16} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                <div className="space-y-2">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="80%" height={16} />
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

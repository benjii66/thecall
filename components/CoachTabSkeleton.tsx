"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Skeleton } from "./SkeletonLoader";

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
      
      {/* Fun Loading Bar Area */}
      <div className="mx-auto max-w-md text-center py-8">
        <div className="mb-4 flex flex-col items-center gap-4">
            <div className="relative h-24 w-24">
                <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                    <Image 
                        src="/poro.png" 
                        alt="Loading Poro" 
                        width={80} 
                        height={80} 
                        className="object-contain mix-blend-screen" 
                    />
                </div>
                <div className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-400 opacity-20"></div>
                <div className="absolute -inset-4 animate-pulse rounded-full border border-cyan-500/30"></div>
            </div>
            <p className="min-h-[1.5em] text-sm font-medium text-cyan-300 transition-all duration-300 mt-2">
                {LOADING_MESSAGES[messageIndex]}
            </p>
        </div>
        
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/40">{Math.round(progress)}%</p>
      </div>

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

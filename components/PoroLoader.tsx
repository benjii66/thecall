"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PoroLoaderProps {
  message?: string;
  progress?: number;
  className?: string;
}

const DEFAULT_MESSAGES = [
  "Caresses aux Poros...",
  "Calcul des statistiques...",
  "Analyse du gameplay...",
  "Inspection du Nexus...",
  "Chargement des éclats de runes...",
];

export function PoroLoader({ message, progress, className }: PoroLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (message) return; // Don't rotate if a fixed message is provided

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || DEFAULT_MESSAGES[messageIndex];

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="relative mb-6 h-24 w-24">
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

      <p className="min-h-[1.5em] text-sm font-medium text-cyan-300 transition-all duration-300">
        {displayMessage}
      </p>

      {progress !== undefined && (
        <div className="mt-4 w-full max-w-xs">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-white/30">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}

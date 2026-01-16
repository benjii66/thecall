"use client";

import { WinProbPoint } from "@/lib/winProbability";

export function WinProbabilityChart({ data }: { data: WinProbPoint[] }) {
  if (!data.length) return null;

  const maxMinute = Math.max(data[data.length - 1]?.minute ?? 1, 1);
  const last = data[data.length - 1];

  // Convertit les points en courbe lissée (path SVG) pour un rendu plus "non linéaire"
  const pathD = buildSmoothPath(
    data.map((p) => ({
      x: (p.minute / maxMinute) * 100,
      y: 100 - p.probability,
    }))
  );

  // Trouver le point le plus haut et le plus bas pour les gradients dynamiques
  // maxProb et minProb réservés pour futures améliorations de gradient
  // const maxProb = Math.max(...data.map((p) => p.probability));
  // const minProb = Math.min(...data.map((p) => p.probability));
  const isWinning = last.probability > 50;

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-gradient-to-br from-black/40 to-black/20 p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white/90">Win Probability</h3>
          <p className="mt-0.5 text-xs text-white/50">
            Évolution de la probabilité de victoire
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 self-start sm:self-auto">
          <div className={`text-sm font-bold ${isWinning ? "text-cyan-300" : "text-red-300"}`}>
            {last.probability}%
          </div>
          <div className="text-[10px] text-white/40">
            min {last.minute}
          </div>
        </div>
      </div>

      <div className="relative h-48 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            {/* Gradient pour la ligne - plus vibrant */}
            <linearGradient id="probLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            
            {/* Gradient pour la zone remplie - plus subtil et moderne */}
            <linearGradient id="probAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,182,212,0.25)" />
              <stop offset="50%" stopColor="rgba(139,92,246,0.15)" />
              <stop offset="100%" stopColor="rgba(239,68,68,0.25)" />
            </linearGradient>

            {/* Glow effect pour la ligne */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Zones colorées pour lecture rapide */}
          <rect
            x="0"
            y="0"
            width="100"
            height="50"
            fill="rgba(6,182,212,0.08)"
          />
          <rect
            x="0"
            y="50"
            width="100"
            height="50"
            fill="rgba(239,68,68,0.08)"
          />

          {/* 50% baseline - plus visible */}
          <line
            x1="0"
            x2="100"
            y1="50"
            y2="50"
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Zone remplie sous la courbe avec gradient */}
          <path
            d={`${pathD} L 100 50 L 0 50 Z`}
            fill="url(#probAreaGrad)"
            opacity="0.7"
          />

          {/* Courbe principale avec glow */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#probLineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              strokeDasharray: 400,
              strokeDashoffset: 0,
              animation: "dashDraw 1.6s ease-out forwards",
            }}
          />

          {/* Point final avec indicateur */}
          {data.length > 0 && (
            <g>
              <circle
                cx={(last.minute / maxMinute) * 100}
                cy={100 - last.probability}
                r="3"
                fill={isWinning ? "#06b6d4" : "#ef4444"}
                className="drop-shadow-lg"
              />
              <circle
                cx={(last.minute / maxMinute) * 100}
                cy={100 - last.probability}
                r="5"
                fill={isWinning ? "rgba(6,182,212,0.3)" : "rgba(239,68,68,0.3)"}
                className="animate-pulse"
              />
            </g>
          )}
        </svg>

        {/* Labels sur les côtés */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium uppercase tracking-wide text-white/50">
          50%
        </div>
        <div className="absolute right-2 top-2 text-[10px] text-white/40">
          0:00
        </div>
        <div className="absolute right-2 bottom-2 text-[10px] text-white/40">
          {maxMinute}:00
        </div>
      </div>
    </div>
  );
}

// Génère une courbe lissée (spline de Cardinale simplifiée) à partir de points [0‑100]
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return "";
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x} ${y}`;
  }

  const tension = 0.25;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 6;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 6;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 6;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 6;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

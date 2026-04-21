"use client";

import { TrendPoint } from "@/types/profile";
import { useLanguage } from "@/lib/language";
import { AnimatedItem } from "./AnimatedSection";
import { TrendingUp, TrendingDown, Target, Eye, Footprints } from "lucide-react";

export function ProfileTrends({ history }: { history: TrendPoint[] }) {
  const { t } = useLanguage();

  if (!history || history.length < 2) {
    return null;
  }

  // Extraire les séries
  const csSeries = history.map(h => h.csPerMin);
  const kpSeries = history.map(h => h.kp);
  const visionSeries = history.map(h => h.visionScore);

  return (
    <div className="mt-10">
      <div className="grid gap-6 md:grid-cols-3">
        <TrendCard 
          title={t("profile.trends.cs")} 
          data={csSeries} 
          color="amber" 
          icon={<Footprints className="h-4 w-4" />}
          suffix=" CS/m"
        />
        <TrendCard 
          title={t("profile.trends.kp")} 
          data={kpSeries} 
          color="cyan" 
          icon={<Target className="h-4 w-4" />}
          suffix="%"
        />
        <TrendCard 
          title={t("profile.trends.vision")} 
          data={visionSeries} 
          color="emerald" 
          icon={<Eye className="h-4 w-4" />}
          suffix=""
        />
      </div>
    </div>
  );
}


function TrendCard({ 
  title, 
  data, 
  color, 
  icon,
  suffix
}: { 
  title: string; 
  data: number[]; 
  color: "amber" | "cyan" | "emerald";
  icon: React.ReactNode;
  suffix: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Calculer la tendance (comparer moyenne 1ère moitié vs 2ème moitié)
  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const secondHalf = data.slice(half).reduce((a, b) => a + b, 0) / (data.length - half);
  const isImproving = secondHalf >= firstHalf;
  const lastVal = data[data.length - 1];

  const colors = {
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      stroke: "#f59e0b",
      text: "text-amber-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    },
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      stroke: "#06b6d4",
      text: "text-cyan-400",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.2)]"
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      stroke: "#10b981",
      text: "text-emerald-400",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]"
    }
  };

  const c = colors[color];

  // Générer le chemin SVG
  const width = 200;
  const height = 60;
  const padding = 5;
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    // Inverser Y (0 est en haut)
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <AnimatedItem>
      <div className={`relative overflow-hidden rounded-2xl border ${c.border} ${c.bg} p-5 backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${c.bg} ${c.text}`}>
              {icon}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{title}</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold ${isImproving ? 'text-emerald-400' : 'text-red-400'}`}>
            {isImproving ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isImproving ? 'UP' : 'DOWN'}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className={`text-2xl font-bold tracking-tight ${c.text}`}>
              {lastVal}{suffix}
            </div>
            <div className="text-[10px] text-white/30 tracking-tight">Dernier match</div>
          </div>

          {/* Sparkline */}
          <div className="flex-1 max-w-[140px]">
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.stroke} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={c.stroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Fill */}
              <path 
                d={`M ${padding},${height} L ${points} L ${width - padding},${height} Z`}
                fill={`url(#grad-${color})`}
              />
              {/* Line */}
              <polyline
                fill="none"
                stroke={c.stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className={c.glow}
              />
            </svg>
          </div>
        </div>
      </div>
    </AnimatedItem>
  );
}

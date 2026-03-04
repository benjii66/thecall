"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noiseOpacity?: number;
  hoverEffect?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  noiseOpacity = 0.03,
  hoverEffect = false,
  ...props 
}: GlassCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10",
        "bg-[#090b14]/60 backdrop-blur-md", // Dark semi-opaque base (match Hero Preview)
        "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_60px_rgba(0,0,0,0.6)]", // High contrast border & deep shadow
        // Top reflection gradient (Sharp)
        "before:absolute before:inset-0 before:z-[-1] before:bg-gradient-to-b before:from-white/[0.07] before:to-transparent before:opacity-100",
        hoverEffect && "transition-transform duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_30px_80px_rgba(34,211,238,0.15)]", // Lift effect
        className
      )}
      {...props}
    >
        {/* Subtle atmospheric glow - gives the "thick glass" depth */}
        <div className="pointer-events-none absolute -top-[100px] -left-[100px] h-[300px] w-[300px] bg-cyan-500/10 blur-3xl opacity-50 mix-blend-screen" />
        
        {/* Content wrapper to stay above glows */}
        <div className="relative z-10">
            {children}
        </div>
    </div>
  );
}

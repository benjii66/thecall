"use client";

import { useThemeStore } from "@/lib/store/themeStore";
import { cn } from "@/lib/utils";

export function BackgroundFX() {
  const { theme } = useThemeStore();

  const gradients = {
    default: "bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]",
    victory: "bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(52,211,153,0.15),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(6,182,212,0.12),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(16,185,129,0.10),transparent_60%)]",
    defeat: "bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(248,113,113,0.15),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(251,146,60,0.12),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(239,68,68,0.10),transparent_60%)]",
  };

  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <div className={cn("absolute inset-0 transition-opacity duration-1000", gradients[theme] || gradients.default)} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 opacity-[0.05]" />
    </div>
  );
}

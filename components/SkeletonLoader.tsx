"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Composant Skeleton réutilisable pour les états de chargement
 */
export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = "bg-white/10 rounded";
  const variantClasses = {
    text: "h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animate && "animate-pulse",
        className
      )}
      style={style}
      aria-busy="true"
      aria-label="Chargement..."
    />
  );
}

/**
 * Skeleton pour une carte de match
 */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

/**
 * Skeleton pour une liste de matchs
 */
export function MatchListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton pour le header d'un match
 */
export function MatchHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" height={16} />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton variant="rectangular" width={120} height={32} />
        <Skeleton variant="rectangular" width={120} height={32} />
        <Skeleton variant="rectangular" width={120} height={32} />
      </div>
    </div>
  );
}

/**
 * Skeleton pour un graphique
 */
export function ChartSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-6">
      <Skeleton variant="text" width="30%" height={20} />
      <Skeleton variant="rectangular" width="100%" height={200} />
      <div className="flex gap-4">
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="20%" />
      </div>
    </div>
  );
}

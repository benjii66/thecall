"use client";

import { Skeleton } from "./SkeletonLoader";

/**
 * Skeleton pour l'onglet Coach pendant le chargement
 */
export function CoachTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quota Badge Skeleton */}
      <div className="flex justify-end">
        <Skeleton variant="rectangular" width={200} height={40} />
      </div>

      {/* Turning Point Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <Skeleton variant="text" width="30%" height={24} className="mb-4" />
        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="80%" height={16} />
        <div className="mt-4 flex gap-2">
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={120} height={32} />
        </div>
      </div>

      {/* Focus Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <Skeleton variant="text" width="25%" height={24} className="mb-4" />
        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="90%" height={16} />
      </div>

      {/* Action Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <Skeleton variant="text" width="20%" height={24} className="mb-4" />
        <Skeleton variant="text" width="100%" height={16} />
      </div>

      {/* Positives/Negatives Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <Skeleton variant="text" width="40%" height={24} className="mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="100%" height={14} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <Skeleton variant="text" width="40%" height={24} className="mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="100%" height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

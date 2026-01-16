// components/MatchDetailSkeleton.tsx
import { Skeleton, MatchHeaderSkeleton, ChartSkeleton } from "./SkeletonLoader";

export function MatchDetailSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <MatchHeaderSkeleton />
      </div>

      {/* Timeline */}
      <div>
        <Skeleton variant="text" width="30%" height={24} className="mb-4" />
        <div className="h-52 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </div>
      </div>

      {/* Win Probability */}
      <div>
        <Skeleton variant="text" width="40%" height={24} className="mb-4" />
        <ChartSkeleton />
      </div>

      {/* Duel Section */}
      <div>
        <Skeleton variant="text" width="25%" height={24} className="mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/40 p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton variant="circular" width={64} height={64} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton variant="circular" width={64} height={64} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

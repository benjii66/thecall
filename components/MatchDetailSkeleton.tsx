// components/MatchDetailSkeleton.tsx
export function MatchDetailSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 animate-pulse rounded-xl bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-white/10" />
            <div className="h-4 w-32 animate-pulse rounded-lg bg-white/5" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="mb-4 h-6 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="h-52 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
      </div>

      {/* Win Probability */}
      <div>
        <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-white/10" />
        <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
      </div>
    </div>
  );
}

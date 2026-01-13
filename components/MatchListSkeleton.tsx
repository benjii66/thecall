// components/MatchListSkeleton.tsx
export function MatchListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
            <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

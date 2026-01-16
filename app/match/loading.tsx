// app/match/loading.tsx
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { MatchListSkeleton, Skeleton } from "@/components/SkeletonLoader";

export default function MatchLoading() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] noise" />
      </div>
      <section className="relative mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="mb-8">
          <Skeleton variant="text" width="48" height={36} />
          <Skeleton variant="text" width="64" height={20} className="mt-2" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-2 mb-6">
          <Skeleton variant="rectangular" width="40" height={40} />
        </div>
        <MatchListSkeleton count={5} />
      </section>
    </main>
  );
}

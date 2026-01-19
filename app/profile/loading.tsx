import { NavbarWrapper } from "@/components/NavbarWrapper";
import { Skeleton } from "@/components/SkeletonLoader";
import { BackgroundFX } from "@/components/BackgroundFX";

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        {/* Hero skeleton */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <Skeleton variant="text" width="48" height={36} className="mb-4" />
          <Skeleton variant="text" width="64" height={24} />
        </div>

        {/* Playstyle skeleton */}
        <div className="mt-10 space-y-4">
          <Skeleton variant="text" width="40" height={24} />
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={128} />
              ))}
            </div>
          </div>
        </div>

        {/* Insights skeleton */}
        <div className="mt-10 space-y-4">
          <Skeleton variant="text" width="40" height={24} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <Skeleton variant="text" width="60%" height={20} className="mb-2" />
                <Skeleton variant="text" width="100%" height={16} className="mb-1" />
                <Skeleton variant="text" width="80%" height={16} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

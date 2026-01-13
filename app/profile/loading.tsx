// app/profile/loading.tsx
import { NavbarWrapper } from "@/components/NavbarWrapper";

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] noise" />
      </div>
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        {/* Hero skeleton */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 animate-pulse">
          <div className="h-9 w-48 bg-white/10 rounded-lg mb-4" />
          <div className="h-6 w-64 bg-white/5 rounded-lg" />
        </div>

        {/* Playstyle skeleton */}
        <div className="mt-10 space-y-4">
          <div className="h-6 w-40 bg-white/10 rounded-lg animate-pulse" />
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Insights skeleton */}
        <div className="mt-10 space-y-4">
          <div className="h-6 w-40 bg-white/10 rounded-lg animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { WinProbPoint } from "@/lib/winProbability";

export function WinProbabilityChart({ data }: { data: WinProbPoint[] }) {
  if (!data.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/70">
        Win Probability
      </h3>

      <div className="relative h-32 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            points={data
              .map(
                (p) =>
                  `${(p.minute / data.length) * 100},${100 - p.probability}`
              )
              .join(" ")}
          />
        </svg>

        <div className="absolute right-2 top-2 text-xs text-white/50">
          {data[data.length - 1].probability}% win
        </div>
      </div>
    </div>
  );
}

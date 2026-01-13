// components/LoadingSpinner.tsx
"use client";

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white/20 border-t-cyan-400"
      style={{ width: size, height: size }}
    />
  );
}

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { GlowOverlay } from "./GlowOverlay";

interface NavigationButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}

export function NavigationButton({
  href,
  children,
  className = "",
  variant = "primary",
}: NavigationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showGlow, setShowGlow] = useState(false);

  const handleClick = () => {
    setShowGlow(true);
    startTransition(() => {
      router.push(href);
      setTimeout(() => setShowGlow(false), 800);
    });
  };

  const baseClasses =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b] w-full sm:w-auto"
      : "inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 w-full sm:w-auto";

  return (
    <>
      <GlowOverlay show={showGlow} />
      <motion.button
        onClick={handleClick}
        disabled={isPending}
        className={`${baseClasses} ${className} relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 opacity-0 group-hover:opacity-100"
          initial={false}
          transition={{ duration: 0.3 }}
        />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    </>
  );
}

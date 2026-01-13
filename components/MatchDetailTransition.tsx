"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Transition pour affichage du match sélectionné (summon effect)
const matchDetailVariants = {
  initial: {
    opacity: 0,
    y: 40,
    scale: 0.96,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export function MatchDetailTransition({
  children,
  matchId,
}: {
  children: ReactNode;
  matchId: string;
}) {
  return (
    <motion.div
      key={matchId}
      initial="initial"
      animate="animate"
      variants={matchDetailVariants}
      className="relative"
    >
      {/* Subtle glow on mount */}
      <motion.div
        className="pointer-events-none absolute -inset-4 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 blur-2xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 1] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {children}
    </motion.div>
  );
}

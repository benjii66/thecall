"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Transition pour page profil (effet portal/3D)
export function ProfilePageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className="relative"
      style={{ perspective: "1000px" }}
    >
      {/* Glow effect */}
      <motion.div
        className="pointer-events-none absolute -inset-8 bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-cyan-500/0 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1] }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {children}
    </motion.div>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// Transition pour changement d'onglet (Overview ↔ Coach)
const tabVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    filter: "blur(4px)",
    transition: {
      duration: 0.3,
      ease: [0.55, 0.06, 0.68, 0.19] as const,
    },
  },
};

// Transition pour match selection (list → detail)
const matchDetailVariants = {
  initial: {
    opacity: 0,
    y: 40,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.55, 0.06, 0.68, 0.19] as const,
    },
  },
};

export function RouteTransition({
  children,
  key,
  variant = "tab",
}: {
  children: ReactNode;
  key: string;
  variant?: "tab" | "match";
}) {
  const variants = variant === "match" ? matchDetailVariants : tabVariants;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="relative"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

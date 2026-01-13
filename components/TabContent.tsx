"use client";

import { motion, AnimatePresence } from "framer-motion";

type TabContentProps = {
  activeTab: string;
  children: React.ReactNode;
};

// Variantes pour transition coaching avec effet glow
const coachVariants = {
  initial: { opacity: 0, x: 20, scale: 0.98, filter: "blur(4px)" },
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

const overviewVariants = {
  initial: { opacity: 0, x: -20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.55, 0.06, 0.68, 0.19] as const,
    },
  },
};

export function TabContent({ activeTab, children }: TabContentProps) {
  const variants = activeTab === "coach" ? coachVariants : overviewVariants;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="relative"
      >
        {/* Subtle glow pour transition coach */}
        {activeTab === "coach" && (
          <motion.div
            className="pointer-events-none absolute -inset-2 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-cyan-500/0 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}

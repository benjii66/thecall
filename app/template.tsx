"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

// Template pour transitions de page LoL-style (Next.js App Router)
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    // Utiliser un timeout pour éviter les cascades de render
    const timer = setTimeout(() => {
      setShowGlow(true);
      setDisplayChildren(children);
      setTimeout(() => setShowGlow(false), 800);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname, children]);

  // Variantes selon la route
  const getVariants = () => {
    if (pathname === "/profile") {
      return {
        initial: { opacity: 0, y: 30, rotateX: -5 },
        animate: { opacity: 1, y: 0, rotateX: 0 },
        exit: { opacity: 0, y: -20 },
      };
    }
    if (pathname === "/match") {
      return {
        initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 1.02, filter: "blur(4px)" },
      };
    }
    // Default (index)
    return {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.01 },
    };
  };

  const variants = getVariants();

  return (
    <>
      {/* Glow overlay pour effet LoL */}
      {showGlow && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3),rgba(139,92,246,0.2),transparent_70%)]" />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={pathname === "/profile" ? { perspective: "1000px" } : undefined}
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

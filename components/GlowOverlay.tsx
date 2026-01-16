"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Overlay de glow LoL-style pour les transitions importantes
export function GlowOverlay({ show }: { show: boolean }) {
  // Générer les positions aléatoires une seule fois avec useMemo
  // Note: Math.random() dans useMemo est acceptable car il ne s'exécute qu'une fois au montage
  const [particles, setParticles] = useState<Array<{
    initialX: number;
    initialY: number;
    animateX: number;
    animateY: number;
  }>>([]);

  useEffect(() => {
    // eslint-disable-next-line
    setParticles(
      [...Array(6)].map(() => ({
        initialX: 50 + (Math.random() - 0.5) * 20,
        initialY: 50 + (Math.random() - 0.5) * 20,
        animateX: 50 + (Math.random() - 0.5) * 40,
        animateY: 50 + (Math.random() - 0.5) * 40,
      }))
    );
  }, []);

  if (!show) return null;

  return (
    <>
      {/* Main glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3),rgba(139,92,246,0.2),transparent_70%)]" />
      </motion.div>

      {/* Ripple effect */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[59]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,197,253,0.2),transparent_70%)]" />
      </motion.div>

      {/* Particles effect (simplifié avec CSS) */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[58] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400"
            initial={{
              x: `${particle.initialX}%`,
              y: `${particle.initialY}%`,
              opacity: 0,
            }}
            animate={{
              x: `${particle.animateX}%`,
              y: `${particle.animateY}%`,
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>
    </>
  );
}

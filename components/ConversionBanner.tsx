"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface ConversionBannerProps {
  variant: "first-coaching" | "quota-exhausted" | "mini-profile";
  onDismiss?: () => void;
}

export function ConversionBanner({
  variant,
  onDismiss,
}: ConversionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const variants = {
    "first-coaching": {
      title: "Tu veux les causes + le plan + les drills ?",
      subtitle: "Upgrade Pro pour coaching IA premium",
      cta: "Upgrade Pro",
      icon: Sparkles,
    },
    "quota-exhausted": {
      title: "Upgrade Pro pour coaching illimité",
      subtitle: "Plus de limite mensuelle + profil complet",
      cta: "Upgrade Pro",
      icon: Sparkles,
    },
    "mini-profile": {
      title: "Débloquer profil complet avec 50+ matchs",
      subtitle: "Patterns récurrents + rapport mensuel + insights détaillés",
      cta: "Upgrade Pro",
      icon: Sparkles,
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <Icon className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">
                  {config.title}
                </h4>
                <p className="mt-1 text-xs text-white/60">
                  {config.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-cyan-400"
              >
                {config.cta}
                <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                onClick={handleDismiss}
                className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

interface PaywallSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  price?: string;
}

export function PaywallSection({
  title,
  description,
  icon: Icon,
  price,
}: PaywallSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6"
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm" />
      
      {/* Lock icon */}
      <div className="absolute right-4 top-4">
        <Lock className="h-5 w-5 text-white/30" />
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-2">
            <Icon size={20} className="text-white/40" />
          </div>
          <h3 className="text-lg font-semibold text-white/60">{title}</h3>
        </div>
        
        <p className="mb-4 text-sm text-white/40">{description}</p>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-violet-400 hover:to-cyan-400"
        >
          <Sparkles size={14} />
          Débloquer avec Pro
          {price && <span className="ml-1 text-xs opacity-90">({price})</span>}
        </Link>
      </div>
    </motion.div>
  );
}

export function PaywallSections() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <PaywallSection
        title="Causes racines"
        description="Preuves détaillées + événements + timings précis"
        icon={Target}
        price="3.99€/mois"
      />
      <PaywallSection
        title="Plan d'action"
        description="3 règles + anti-erreurs + priorités early/mid/late"
        icon={TrendingUp}
        price="3.99€/mois"
      />
      <PaywallSection
        title="Drills / exercices"
        description="Exercices personnalisés sur 3-5 games"
        icon={Sparkles}
        price="3.99€/mois"
      />
    </div>
  );
}

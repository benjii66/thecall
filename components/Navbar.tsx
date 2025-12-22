"use client";

import { motion } from "framer-motion";
import { Sparkles, Map, Brain, User } from "lucide-react";
import { useState } from "react";

const items = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "objectives", label: "Objectives", icon: Map },
  { id: "coach", label: "Coach", icon: Brain },
];

export function Navbar() {
  const [active, setActive] = useState("overview");

  return (
    <nav className="relative mx-auto mt-6 max-w-6xl rounded-2xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400" />
          <div>
            <div className="text-sm font-semibold tracking-wide">TheCall</div>
            <div className="text-xs text-white/50">Macro Coach</div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative flex gap-2 rounded-xl bg-black/5 p-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="relative z-10 flex items-center gap-2 px-4 py-2 text-sm text-white/80"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/30 to-cyan-400/30"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-white/60">
            BNJ<br />#6627
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10">
            <User size={16} />
          </div>
        </div>
      </div>
    </nav>
  );
}

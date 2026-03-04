"use client";

import type { BuildData } from "@/types/match";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language";
import { GlassCard } from "@/components/GlassCard";

function BuildTitle({ variant }: { variant: "yours" | "opponent" }) {
  const { t } = useLanguage();
  const isYours = variant === "yours";
  
  return (
    <h4 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${isYours ? "text-cyan-300" : "text-red-300"}`}>
      {isYours ? t("build.yourBuild") : t("build.opponentBuild")}
    </h4>
  );
}

export function MatchBuildSection({
  you,
  opponent,
}: {
  you: BuildData;
  opponent?: BuildData;
}) {
  // État partagé : cliquer sur l'un ouvre les deux
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const { t } = useLanguage();
  
  return (
    <section className="mt-10">
      <GlassCard className="p-4 sm:p-6" hoverEffect>
        <h3 className="mb-4 sm:mb-6 text-sm font-semibold uppercase tracking-wide text-white/60">
          {t("build.title")}
        </h3>

        {/* Container unifié avec séparation visuelle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-black/30 overflow-hidden"
        >
          {/* Header unifié */}
          <button
            onClick={handleToggle}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            <span>Comparaison des builds</span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </motion.div>
          </button>

          {/* Contenu avec séparation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
                  opacity: { duration: 0.3, delay: 0.1 },
                }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 divide-x divide-white/10">
                  {/* Ton build */}
                  <div className="px-4 py-4">
                    <BuildTitle variant="yours" />
                    <BuildContent
                      items={you.items}
                      runes={you.runes}
                      itemNames={you.itemNames}
                      runeNames={you.runeNames}
                      delay={0}
                    />
                  </div>

                  {/* Build adversaire */}
                  {opponent && (
                    <div className="px-4 py-4">
                      <BuildTitle variant="opponent" />
                      <BuildContent
                        items={opponent.items}
                        runes={opponent.runes}
                        itemNames={opponent.itemNames}
                        runeNames={opponent.runeNames}
                        delay={0.1}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </GlassCard>
    </section>
  );
}

function BuildContent({
  items,
  runes,
  itemNames,
  runeNames,
  delay,
}: {
  items: string[];
  runes: string[];
  itemNames?: Record<string, string>;
  runeNames?: Record<string, string>;
  delay: number;
}) {
  const { t } = useLanguage();
  const DD_VERSION = "14.23.1";
  const itemIcon = (id: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/item/${id}.png`;
  const runeIcon = (path: string) =>
    `https://ddragon.leagueoflegends.com/cdn/img/${path}`;

  return (
    <div className="space-y-4">
      {/* ITEMS */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: delay + 0.2 }}
      >
        <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
          {t("build.items")}
        </p>
        <div className="flex gap-2 flex-wrap">
          {items
            .filter((id) => {
              // Filtrer les items invalides (comme 3175 qui n'existe pas dans Data Dragon)
              // On garde seulement ceux qui ont un nom ou une image valide
              return itemNames?.[id] || id !== "3175";
            })
            .map((id, idx) => {
              const itemName = itemNames?.[id] || `Item ${id}`;
              const iconUrl = itemIcon(id);
              
              return (
                <motion.div
                  key={`${id}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.2,
                    delay: delay + 0.3 + idx * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className="group relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconUrl}
                    alt={itemName}
                    width={36}
                    height={36}
                    className="rounded border border-white/10 cursor-help"
                    onError={(e) => {
                      // Si l'image ne charge pas, on cache l'élément
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/95 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                    {itemName}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
                  </div>
                </motion.div>
              );
            })}
        </div>
      </motion.div>

      {/* RUNES */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: delay + 0.25 }}
      >
        <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
          {t("build.runes")}
        </p>
        <div className="flex gap-3 flex-wrap">
          {runes.map((r, idx) => {
            const runeName = runeNames?.[r] || "Rune";
            return (
              <motion.div
                key={r}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.2,
                  delay: delay + 0.35 + idx * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.15, zIndex: 10 }}
                className="group relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={runeIcon(r)}
                  alt={runeName}
                  className="w-8 h-8 cursor-help"
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/95 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  {runeName}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

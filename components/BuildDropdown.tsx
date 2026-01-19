"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/lib/language";

type BuildDropdownProps = {
  title?: string;
  items: string[]; // item ids ou noms
  runes: string[];
  isOpen: boolean;
  onToggle: () => void;
  delay?: number; // Délai pour l'animation en cascade
};

const DD_VERSION = "14.23.1";
const itemIcon = (id: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/item/${id}.png`;
const runeIcon = (path: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/${path}`;

export function BuildDropdown({
  title,
  items,
  runes,
  isOpen,
  onToggle,
  delay = 0,
}: BuildDropdownProps) {
  const { t } = useLanguage();
  const displayTitle = title || t("build.title");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-white/10 bg-black/30 overflow-hidden"
    >
      {/* HEADER */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <span>{displayTitle}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* CONTENT avec animation en cascade */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] as const },
              opacity: { duration: 0.3, delay: delay + 0.1 },
            }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{
                duration: 0.4,
                delay: delay + 0.1,
                ease: [0.4, 0, 0.2, 1] as const,
              }}
              className="space-y-4 px-4 pb-4"
            >
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
                  {items.map((id, idx) => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: delay + 0.3 + idx * 0.05,
                        ease: "easeOut",
                      }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      className="relative"
                    >
                      <Image
                        src={itemIcon(id)}
                        alt={id}
                        title={id}
                        width={36}
                        height={36}
                        className="rounded border border-white/10"
                      />
                    </motion.div>
                  ))}
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
                  {runes.map((r, idx) => (
                    <motion.img
                      key={r}
                      src={runeIcon(r)}
                      alt="rune"
                      className="w-8 h-8"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: delay + 0.35 + idx * 0.05,
                        ease: "easeOut",
                      }}
                      whileHover={{ scale: 1.15, zIndex: 10 }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

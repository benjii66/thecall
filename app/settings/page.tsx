"use client";

import { useState } from "react";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { motion } from "framer-motion";
import { Settings, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageChange = async (newLanguage: "fr" | "en") => {
    setIsSaving(true);
    setLanguage(newLanguage);
    
    // Simuler un délai de sauvegarde
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      
      {/* Background FX */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(0,255,255,0.12),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(255,0,128,0.10),transparent_60%),radial-gradient(1100px_700px_at_50%_120%,rgba(120,70,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] noise" />
      </div>

      <section className="relative mx-auto max-w-4xl px-6 pb-16 pt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition mb-6"
          >
            <ArrowLeft size={16} />
            <span>{t("common.back")}</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <Settings size={24} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{t("settings.title")}</h1>
              <p className="text-sm text-white/60 mt-1">{t("settings.subtitle")}</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Language Section */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-cyan-300" />
              <div>
                <h2 className="text-lg font-semibold">{t("settings.language")}</h2>
                <p className="text-sm text-white/60 mt-0.5">{t("settings.languageDesc")}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleLanguageChange("fr")}
                disabled={isSaving}
                className={`flex-1 px-4 py-3 rounded-xl border transition ${
                  language === "fr"
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="font-medium">Français</div>
                <div className="text-xs text-white/50 mt-0.5">FR</div>
              </button>

              <button
                onClick={() => handleLanguageChange("en")}
                disabled={isSaving}
                className={`flex-1 px-4 py-3 rounded-xl border transition ${
                  language === "en"
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="font-medium">English</div>
                <div className="text-xs text-white/50 mt-0.5">EN</div>
              </button>
            </div>

            {isSaving && (
              <p className="text-xs text-cyan-300 mt-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                {t("settings.saving")}
              </p>
            )}
          </div>

          {/* Future sections placeholder */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 opacity-50">
            <p className="text-sm text-white/40">
              {t("settings.futureSettings")}
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

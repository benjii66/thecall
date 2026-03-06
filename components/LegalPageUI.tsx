"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FileText, Gavel, Scale } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";

export function LegalPageUI() {
  const { t } = useLanguage();

  return (
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
            <Scale size={24} className="text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("legal.title") || "Mentions Légales"}
            </h1>
            <p className="text-sm text-white/60 mt-1">
              {t("legal.subtitle") || "Conditions d'utilisation et mentions légales"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-6"
      >
        {/* Riot Disclaimer */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Gavel size={20} className="text-rose-300" />
            <h2 className="text-xl font-semibold text-rose-100">Riot Games Legal Notice</h2>
          </div>
          <p className="text-sm text-white/70 leading-relaxed italic">
            The Call isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
          </p>
        </div>

        {/* Terms of Service */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-cyan-300" />
            <h2 className="text-xl font-semibold">{t("legal.termsTitle") || "Conditions d'Utilisation"}</h2>
          </div>
          <div className="space-y-4 text-sm text-white/70">
            <p>
              En accédant à The Call, vous acceptez d&apos;être lié par ces conditions d&apos;utilisation, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable de la conformité avec toutes les lois locales applicables.
            </p>
            <p>
              The Call utilise l&apos;API Riot Games. En utilisant ce site, vous vous engagez également à respecter les Conditions d&apos;Utilisation de Riot Games.
            </p>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-4">{t("legal.ownerTitle") || "Propriété Intellectuelle"}</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            The Call est un projet indépendant. Tous les contenus relatifs à League of Legends, y compris les noms de champions, les images et les statistiques, sont la propriété de Riot Games, Inc.
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-4">{t("legal.contactTitle") || "Contact"}</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter via notre interface de support ou par email.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

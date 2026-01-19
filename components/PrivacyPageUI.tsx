"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield, Cookie, FileText } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";

export function PrivacyPageUI() {
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
            <Shield size={24} className="text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("privacy.title")}
            </h1>
            <p className="text-sm text-white/60 mt-1">
              {t("privacy.subtitle")}
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
        {/* Introduction */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <p className="text-sm text-white/70 leading-relaxed">
            {t("privacy.intro")}
          </p>
        </div>

        {/* Cookies Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Cookie size={20} className="text-cyan-300" />
            <h2 className="text-xl font-semibold">{t("privacy.cookiesTitle")}</h2>
          </div>

          <div className="space-y-4 text-sm text-white/70">
            <div>
              <h3 className="font-semibold text-white mb-2">{t("privacy.necessaryCookies")}</h3>
              <p className="leading-relaxed">{t("privacy.necessaryCookiesDesc")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">{t("privacy.functionalCookies")}</h3>
              <p className="leading-relaxed">{t("privacy.functionalCookiesDesc")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">{t("privacy.analyticsCookies")}</h3>
              <p className="leading-relaxed">{t("privacy.analyticsCookiesDesc")}</p>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-cyan-300" />
            <h2 className="text-xl font-semibold">{t("privacy.dataTitle")}</h2>
          </div>

          <div className="space-y-4 text-sm text-white/70">
            <p className="leading-relaxed">{t("privacy.dataDesc")}</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>{t("privacy.dataList1")}</li>
              <li>{t("privacy.dataList2")}</li>
              <li>{t("privacy.dataList3")}</li>
            </ul>
          </div>
        </div>

        {/* Rights Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-4">{t("privacy.rightsTitle")}</h2>
          <div className="space-y-2 text-sm text-white/70">
            <p>{t("privacy.rightsDesc")}</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>{t("privacy.rightsList1")}</li>
              <li>{t("privacy.rightsList2")}</li>
              <li>{t("privacy.rightsList3")}</li>
              <li>{t("privacy.rightsList4")}</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-4">{t("privacy.contactTitle")}</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            {t("privacy.contactDesc")}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

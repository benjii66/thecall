"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Info } from "lucide-react";
import { useLanguage } from "@/lib/language";

export default function RiotAuthPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <section className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
            {t("auth.subtitle")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold">{t("auth.title")}</h1>
          <p className="mt-3 text-sm text-white/70">
            {t("auth.description")}
          </p>

          <div className="mt-6 flex flex-col gap-3 text-sm text-white/70">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-[2px] h-4 w-4 text-cyan-300" />
              <span>{t("auth.vars")}</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="mt-[2px] h-4 w-4 text-white/50" />
              <span>{t("auth.waiting")}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/match"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              {t("auth.continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40"
            >
              {t("auth.back")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

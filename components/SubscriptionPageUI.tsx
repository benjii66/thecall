"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { getClientTier, switchTier } from "@/lib/tierClient";

type Tier = "free" | "pro";
type SubscriptionStatus = {
  tier: Tier;
  isActive: boolean;
  renewalDate?: string;
  cancelAtPeriodEnd?: boolean;
};

export function SubscriptionPageUI() {
  const { t, language } = useLanguage();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    tier: "free",
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  
  useEffect(() => {
    // En mode dev, utiliser localStorage directement
    const tier = getClientTier();
    setSubscription({
      tier,
      isActive: tier === "pro",
      renewalDate: tier === "pro" ? getNextMonth(language) : undefined,
      cancelAtPeriodEnd: false,
    });
    setIsLoading(false);
    
    // Écouter les changements de tier depuis d'autres composants
    const handleTierChange = () => {
      const newTier = getClientTier();
      setSubscription({
        tier: newTier,
        isActive: newTier === "pro",
        renewalDate: newTier === "pro" ? getNextMonth(language) : undefined,
        cancelAtPeriodEnd: false,
      });
    };
    window.addEventListener("tierChanged", handleTierChange);
    
    return () => {
      window.removeEventListener("tierChanged", handleTierChange);
    };
  }, [language]);

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      // TODO: Appel API pour annuler l'abonnement
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSubscription((prev) => ({
        ...prev,
        cancelAtPeriodEnd: true,
      }));
      setShowCancelConfirm(false);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsProcessing(true);
    try {
      // TODO: Appel API pour réactiver l'abonnement
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSubscription((prev) => ({
        ...prev,
        cancelAtPeriodEnd: false,
      }));
    } catch (error) {
      console.error("Erreur lors de la réactivation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngradeToFree = async () => {
    setIsProcessing(true);
    try {
      const result = await switchTier("free");
      if (result.success) {
        const newTier = getClientTier();
        setSubscription({
          tier: newTier,
          isActive: newTier === "pro",
          renewalDate: newTier === "pro" ? getNextMonth(language) : undefined,
          cancelAtPeriodEnd: false,
        });
        setShowDowngradeConfirm(false);
        // Recharger la page pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Erreur lors du passage en gratuit:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setIsProcessing(true);
    try {
      // Call Stripe Checkout API
      // We don't pass userId here, letting the server resolve it from env/session 
      // as per our current "Single User" architecture.
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), 
      });

      if (!res.ok) {
        throw new Error("Checkout initialisation failed");
      }

      const { url } = await res.json();
      if (url) {
        // Redirect to Stripe
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation Stripe:", error);
      alert("Une erreur est survenue lors de la redirection vers le paiement.");
      setIsProcessing(false);
      setShowUpgradeConfirm(false);
    }
    // No finally { setIsProcessing(false) } here because we redirect
  };

  const isPro = subscription.tier === "pro";
  const isCancelling = subscription.cancelAtPeriodEnd;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60">{t("subscription.loading")}</p>
        </div>
      </div>
    );
  }

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
            <CreditCard size={24} className="text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t("subscription.title")}</h1>
            <p className="text-sm text-white/60 mt-1">{t("subscription.subtitle")}</p>
          </div>
        </div>
      </motion.div>

      {/* Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-6"
      >
        {/* Current Plan Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isPro ? (
                  <>
                    <Sparkles size={20} className="text-cyan-300" />
                    <h2 className="text-xl font-semibold">{t("subscription.planPro")}</h2>
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-white/40" />
                    <h2 className="text-xl font-semibold text-white/60">{t("subscription.planFree")}</h2>
                  </>
                )}
              </div>
              <p className="text-sm text-white/60">
                {isPro ? t("subscription.proDesc") : t("subscription.freeDesc")}
              </p>
            </div>
            {isPro && (
              <div className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <span className="text-xs font-semibold text-cyan-300">{t("subscription.active")}</span>
              </div>
            )}
          </div>

          {isPro && subscription.renewalDate && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-white/40" />
                <span className="text-white/60">
                  {t("subscription.renewalDate")}{" "}
                  <span className="text-white font-medium">{subscription.renewalDate}</span>
                </span>
              </div>
            </div>
          )}

          {isCancelling && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-300" />
                <span className="text-sm text-yellow-300">
                  {t("subscription.cancelling")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPro && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-4">{t("subscription.actions")}</h3>
            
            <div className="space-y-3">
              {!isCancelling ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  <span>{t("subscription.cancel")}</span>
                </button>
              ) : (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>{t("subscription.reactivate")}</span>
                </button>
              )}

              <button
                onClick={() => setShowDowngradeConfirm(true)}
                disabled={isProcessing || isCancelling}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{t("subscription.downgrade")}</span>
              </button>
            </div>
          </div>
        )}

        {!isPro && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={24} className="text-cyan-300" />
              <div>
                <h3 className="text-lg font-semibold text-cyan-300">{t("subscription.upgradeTitle")}</h3>
                <p className="text-sm text-white/60 mt-1">
                  {t("subscription.upgradeDesc")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeConfirm(true)}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition font-medium disabled:opacity-50"
              >
                {t("subscription.upgradeTitle")}
              </button>
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl border border-cyan-500/30 bg-transparent text-cyan-300 hover:bg-cyan-500/10 transition font-medium"
              >
                {t("subscription.viewOffers")}
              </Link>
            </div>
          </div>
        )}

        {/* Payment Info (placeholder) */}
        {isPro && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 opacity-50">
            <h3 className="text-sm font-semibold mb-2 text-white/60">{t("subscription.paymentInfo")}</h3>
            <p className="text-xs text-white/40">
              {t("subscription.paymentInfoDesc")}
            </p>
          </div>
        )}
      </motion.div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-[#05060b] p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-2">{t("subscription.cancelConfirmTitle")}</h3>
            <p className="text-sm text-white/60 mb-6">
              {t("subscription.cancelConfirmDesc", { date: subscription.renewalDate || "" })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                {t("subscription.cancelAction")}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                {isProcessing ? t("subscription.processing") : t("subscription.confirm")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {showDowngradeConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-[#05060b] p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-2">{t("subscription.downgradeConfirmTitle")}</h3>
            <p className="text-sm text-white/60 mb-6">
              {t("subscription.downgradeConfirmDesc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeConfirm(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                {t("subscription.cancelAction")}
              </button>
              <button
                onClick={handleDowngradeToFree}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                {isProcessing ? t("subscription.processing") : t("subscription.confirm")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upgrade Confirmation Modal (Dev mode) */}
      {showUpgradeConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-[#05060b] p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-2">{t("subscription.upgradeConfirmTitle")}</h3>
            <p className="text-sm text-white/60 mb-6">
              {t("subscription.upgradeConfirmDesc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeConfirm(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                {t("subscription.cancelAction")}
              </button>
              <button
                onClick={handleUpgradeToPro}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-50"
              >
                {isProcessing ? t("subscription.processing") : t("subscription.confirm")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

function getNextMonth(lang: "fr" | "en"): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });
}

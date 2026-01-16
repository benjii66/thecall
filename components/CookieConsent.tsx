"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield, Settings } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";

type ConsentPreferences = {
  necessary: boolean; // Toujours true (cookies techniques)
  analytics: boolean;
  functional: boolean; // Pour les sessions/rate limiting
};

const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true, // Toujours nécessaire
  analytics: false,
  functional: false,
};

export function CookieConsent() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_CONSENT;
    try {
      const consent = localStorage.getItem("cookie-consent");
      if (consent) {
        return JSON.parse(consent) as ConsentPreferences;
      }
    } catch {}
    return DEFAULT_CONSENT;
  });

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Afficher la bannière après un court délai pour ne pas être trop intrusif
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary: ConsentPreferences = {
      necessary: true,
      analytics: false,
      functional: false,
    };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowSettings(false);
  };

  const saveConsent = (consent: ConsentPreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(consent));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setPreferences(consent);
    setShowBanner(false);
    
    // Si l'utilisateur accepte les cookies fonctionnels, créer un cookie de session
    // pour le rate limiting (conformité RGPD : on ne crée le cookie qu'après consentement)
    if (consent.functional) {
      // Générer un ID de session unique
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      // Stocker dans localStorage (sera envoyé comme cookie si besoin)
      localStorage.setItem("session-id", sessionId);
      
      // Optionnel : créer un cookie HTTP (nécessite un endpoint API ou middleware)
      // Pour l'instant, on utilise localStorage et on le passe via headers si nécessaire
    } else {
      // Supprimer le cookie de session si l'utilisateur refuse
      localStorage.removeItem("session-id");
    }
    
    // Dispatcher un événement pour que les autres composants puissent réagir
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: consent }));
  };

  const hasConsented = () => {
    return preferences.functional || preferences.analytics;
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showBanner || showSettings) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          className="fixed bottom-0 left-0 right-0 z-[10000] p-4 pointer-events-none"
        >
          <div className="mx-auto max-w-4xl pointer-events-auto">
            <div className="rounded-2xl border border-white/10 bg-[#05060b]/95 backdrop-blur-xl shadow-2xl p-6">
              {showSettings ? (
                // Vue des paramètres détaillés
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Settings size={20} className="text-cyan-300" />
                      <h3 className="text-lg font-semibold">{t("cookies.settingsTitle")}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        if (!hasConsented()) {
                          setShowBanner(true);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 transition"
                    >
                      <X size={18} className="text-white/60" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Cookies nécessaires (toujours activés) */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={16} className="text-cyan-300" />
                          <h4 className="font-semibold text-sm">{t("cookies.necessaryTitle")}</h4>
                          <span className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">
                            {t("cookies.alwaysActive")}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 mt-1">{t("cookies.necessaryDesc")}</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Cookies fonctionnels */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Cookie size={16} className="text-cyan-300" />
                          <h4 className="font-semibold text-sm">{t("cookies.functionalTitle")}</h4>
                        </div>
                        <p className="text-xs text-white/60 mt-1">{t("cookies.functionalDesc")}</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.functional}
                          onChange={(e) =>
                            setPreferences((prev) => ({ ...prev, functional: e.target.checked }))
                          }
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Cookies analytiques */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={16} className="text-cyan-300" />
                          <h4 className="font-semibold text-sm">{t("cookies.analyticsTitle")}</h4>
                        </div>
                        <p className="text-xs text-white/60 mt-1">{t("cookies.analyticsDesc")}</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={(e) =>
                            setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                          }
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
                    >
                      {t("cookies.savePreferences")}
                    </button>
                    <Link
                      href="/privacy"
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                    >
                      {t("cookies.learnMore")}
                    </Link>
                  </div>
                </div>
              ) : (
                // Vue de la bannière principale
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <Cookie size={20} className="text-cyan-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{t("cookies.title")}</h3>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {t("cookies.description")}{" "}
                        <Link
                          href="/privacy"
                          className="text-cyan-300 hover:text-cyan-200 underline"
                        >
                          {t("cookies.learnMore")}
                        </Link>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="p-1 rounded-lg hover:bg-white/10 transition"
                    >
                      <X size={18} className="text-white/60" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
                    >
                      {t("cookies.acceptAll")}
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      {t("cookies.rejectAll")}
                    </button>
                    <button
                      onClick={() => {
                        setShowBanner(false);
                        setShowSettings(true);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      {t("cookies.customize")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook pour vérifier si l'utilisateur a consenti aux cookies fonctionnels
 */
export function useCookieConsent(): boolean {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem("cookie-consent");
      if (consent) {
        try {
          const prefs = JSON.parse(consent) as ConsentPreferences;
          setHasConsent(prefs.functional || prefs.analytics);
        } catch {
          setHasConsent(false);
        }
      } else {
        setHasConsent(false);
      }
    };

    checkConsent();

    // Écouter les changements de consentement
    window.addEventListener("cookieConsentUpdated", checkConsent);
    return () => window.removeEventListener("cookieConsentUpdated", checkConsent);
  }, []);

  return hasConsent;
}

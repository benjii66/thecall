"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, User, BarChart3, ArrowLeft, List, LogOut, CreditCard, ChevronDown, Settings } from "lucide-react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GlowOverlay } from "./GlowOverlay";
import { useLanguage } from "@/lib/language";
import { getClientTier } from "@/lib/tierClient";

const items = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "coach", label: "Coach", icon: Brain },
];

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showGlow, setShowGlow] = useState(false);
  
  // Afficher les tabs uniquement si un match est sélectionné
  const matchId = searchParams.get("matchId");
  const showTabs = Boolean(matchId);
  
  // Déterminer l'onglet actif depuis les query params
  const activeTab = searchParams.get("tab") || "overview";
  
  const handleTabClick = (tabId: string) => {
    setShowGlow(true);
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      router.push(`${pathname}?${params.toString()}`);
      
      setTimeout(() => setShowGlow(false), 600);
    });
  };

  const handleProfileClick = () => {
    setShowGlow(true);
    startTransition(() => {
      router.push("/profile");
      setTimeout(() => setShowGlow(false), 800);
    });
  };

  const handleBackToMatches = () => {
    setShowGlow(true);
    startTransition(() => {
      // Retirer matchId et tab pour revenir à la liste
      const params = new URLSearchParams(searchParams.toString());
      params.delete("matchId");
      params.delete("tab");
      // Garder le type de match si présent
      router.push(`/match?${params.toString()}`);
      setTimeout(() => setShowGlow(false), 600);
    });
  };

  return (
    <>
      <GlowOverlay show={showGlow} />
      <nav className="relative mx-auto mt-4 sm:mt-6 max-w-6xl rounded-2xl border border-white/10 bg-black/40 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400" />
          <div>
            <div className="text-sm font-semibold tracking-wide">TheCall</div>
            <div className="text-xs text-white/50">Macro Coach</div>
          </div>
        </Link>

        {/* Menu - Afficher uniquement si match sélectionné */}
        {showTabs && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bouton retour aux matchs */}
            <motion.button
              onClick={handleBackToMatches}
              disabled={isPending}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-white/10 bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Retour aux matchs</span>
              <List size={14} className="sm:hidden" />
            </motion.button>

            {/* Tabs Overview/Coach */}
            <div className="relative flex gap-1 sm:gap-2 rounded-xl bg-black/5 p-0.5 sm:p-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className="relative z-10 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors hover:text-white"
                    style={{ color: isActive ? "white" : "rgba(255,255,255,0.6)" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/30 to-cyan-400/30"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <Icon size={14} className="sm:w-4 sm:h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile & Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            onClick={handleProfileClick}
            disabled={isPending}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-white/10 bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Profil</span>
          </motion.button>
          
          {/* Bouton Pricing visible pour les utilisateurs free */}
          <PricingButton />
          
          {/* User menu dropdown */}
          <UserMenu />
        </div>
      </div>
    </nav>
    </>
  );
}

function UserMenu() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // En mode dev, utiliser localStorage directement
    const tier = getClientTier();
    setTier(tier);
    
    // Écouter les changements de tier (pour recharger quand on change)
    const handleStorageChange = () => {
      const newTier = getClientTier();
      setTier(newTier);
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Également écouter un événement personnalisé pour les changements dans le même onglet
    window.addEventListener("tierChanged", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tierChanged", handleStorageChange);
    };
  }, []);

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!isOpen || !mounted) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    // Utiliser un délai pour éviter la fermeture immédiate
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen, mounted]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setIsOpen(false);
    // TODO: Implémenter la déconnexion
    console.log("Déconnexion...");
  };

  const isFree = tier === "free";

  // Calculer la position du menu
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current && mounted) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, mounted]);

  const menuContent = mounted ? (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-2">
          {/* User info */}
          <div className="px-3 py-2 mb-2 border-b border-white/10">
                  <div className="text-sm font-semibold text-white">BNJ #6627</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {isFree ? t("navbar.userTierFree") : t("navbar.userTierPro")}
                  </div>
          </div>

          {/* Menu items */}
          <button
            onClick={() => handleMenuItemClick("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition cursor-pointer text-left"
            type="button"
          >
                  <Settings size={16} className="text-white/60 flex-shrink-0" />
                  <span>{t("navbar.settings")}</span>
                </button>

              {isFree && (
                <button
                  onClick={() => handleMenuItemClick("/pricing")}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition cursor-pointer text-left"
                  type="button"
                >
                  <CreditCard size={16} className="text-cyan-300 flex-shrink-0" />
                  <span>{t("navbar.upgradeToPro")}</span>
                  <span className="ml-auto text-xs text-cyan-300 font-semibold">3.99€/mois</span>
                </button>
              )}

              {!isFree && (
                <button
                  onClick={() => handleMenuItemClick("/subscription")}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition cursor-pointer text-left"
                  type="button"
                >
                  <CreditCard size={16} className="text-white/60 flex-shrink-0" />
                  <span>{t("navbar.manageSubscription")}</span>
                </button>
              )}

              <div className="my-1 h-px bg-white/10" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer text-left"
                type="button"
              >
                <LogOut size={16} className="flex-shrink-0" />
                <span>{t("navbar.logout")}</span>
              </button>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <>
      <div className="relative">
        <motion.button
          ref={buttonRef}
          onClick={handleMenuClick}
          className="flex items-center gap-2 sm:gap-3 rounded-lg border border-white/10 bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 transition hover:bg-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="hidden sm:block text-right text-xs text-white/60">
            BNJ<br />#6627
          </div>
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/10">
            <User size={14} className="sm:w-4 sm:h-4" />
            {isFree && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#05060b] bg-yellow-500" />
            )}
          </div>
          <ChevronDown 
            size={12} 
            className={`hidden sm:block transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </motion.button>
      </div>
      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}

function PricingButton() {
  const [tier, setTier] = useState<"free" | "pro">("free");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Récupérer le tier
    fetch("/api/tier")
      .then((res) => res.json())
      .then((data: { tier?: "free" | "pro" }) => {
        setTier(data.tier || "free");
      })
      .catch(() => {
        setTier("free");
      });
  }, []);

  // Afficher uniquement pour les utilisateurs free
  if (tier !== "free") {
    return null;
  }

  const handleClick = () => {
    startTransition(() => {
      router.push("/pricing");
    });
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 hover:text-cyan-200 disabled:opacity-60 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Sparkles size={14} className="sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">Pro</span>
    </motion.button>
  );
}

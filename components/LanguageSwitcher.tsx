"use client";

import { useLanguage } from "@/lib/language";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen, mounted]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const selectLanguage = (lang: "fr" | "en") => {
    setLanguage(lang);
    setIsOpen(false);
  };

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
          className="fixed w-36 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl z-[9999] p-1.5"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => selectLanguage("fr")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">FR</span>
            </span>
            {language === "fr" && <Check size={14} className="text-cyan-400" />}
          </button>
          
          <button
            onClick={() => selectLanguage("en")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">EN</span>
            </span>
            {language === "en" && <Check size={14} className="text-cyan-400" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={toggleMenu}
        className="flex md:hidden items-center justify-center p-2 rounded-lg border border-white/10 bg-black/20 transition hover:bg-white/10 text-white/80 hover:text-white sm:flex sm:items-center sm:gap-1.5 sm:px-2 sm:py-1.5"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Changer de langue / Change language"
      >
        <Globe size={16} className="text-white/60" />
        <span className="hidden sm:inline text-xs font-medium uppercase">
          {mounted ? language : ""}
        </span>
        <ChevronDown size={12} className={`hidden sm:block text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>
      {mounted && createPortal(menuContent, document.body)}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
  className?: string; // Additional classes for the trigger
  position?: "left" | "right";
  maxHeight?: string;
}

export function GlassDropdown({
  value,
  onChange,
  options,
  disabled = false,
  className,
  position = "right",
  maxHeight = "300px",
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target as Node;
      
      const clickedTrigger = containerRef.current && containerRef.current.contains(target);
      const clickedMenu = menuRef.current && menuRef.current.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    // Also close on scroll/resize for simplicity using this naive portal implementation
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, { capture: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  const toggleOpen = () => {
    if (disabled) return;
    
    if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use Viewport coordinates for fixed positioning
        setCoords({
            top: rect.bottom + 8,
            left: rect.left,
            right: document.documentElement.clientWidth - rect.right,
            width: rect.width
        });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    if (val !== value) {
      onChange(val);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        ref={containerRef}
        type="button"
        onClick={toggleOpen}
        className={cn(
          "relative flex items-center justify-between gap-3 text-sm font-medium transition-all group outline-none",
          "rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-2.5",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_4px_12px_rgba(0,0,0,0.3)]",
          "hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]",
          isOpen && "bg-white/[0.08] border-white/20 ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.4)]",
          disabled && "opacity-60 pointer-events-none",
          className
        )}
      >
        <span className="truncate flex items-center gap-2">
            {selectedOption?.icon && <span className="opacity-70">{selectedOption.icon}</span>}
            {selectedOption?.label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-white/50 transition-transform duration-300",
            isOpen && "rotate-180 text-white/90"
          )}
        />
      </button>

      {/* PORTALED MENU */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "fixed z-[9999] min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#05060b]/90 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.6)]",
              )}
              style={{
                 position: "fixed",
                 top: coords.top,
                 minWidth: Math.max(200, coords.width),
                 ...(position === "right" 
                    ? { right: coords.right }
                    : { left: coords.left }
                 )
              }}
            >
               {/* Header Shine */}
               <div className="pointer-events-none absolute inset-0 z-[-1] bg-gradient-to-b from-white/[0.05] to-transparent opacity-50" />
               
               <div className="p-1.5 overflow-y-auto custom-scrollbar" style={{ maxHeight }}>
                  {options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-all",
                          isSelected
                            ? "bg-cyan-500/10 text-cyan-200"
                            : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <span className="flex items-center gap-2 whitespace-nowrap">
                           {option.icon && <span className={cn("opacity-70", isSelected && "opacity-100 text-cyan-300")}>{option.icon}</span>}
                           {option.label}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-cyan-400 ml-3" />
                        )}
                      </button>
                    );
                  })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

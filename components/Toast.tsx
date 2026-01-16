"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "error" | "success" | "info" | "warning";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

// ToastContextType défini mais non utilisé directement (utilisé via le contexte)

// Simple toast manager (pas de Context pour éviter la complexité)
let toastListeners: Array<(toast: Toast) => void> = [];
let toastId = 0;

export function showToast(
  message: string,
  type: ToastType = "info",
  duration = 5000
) {
  const id = `toast-${toastId++}`;
  const toast: Toast = { id, message, type, duration };
  toastListeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors = {
    error: "bg-red-500/10 border-red-500/30 text-red-200",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
    info: "bg-cyan-500/10 border-cyan-500/30 text-cyan-200",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-200",
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${colors[toast.type]}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 flex-shrink-0 rounded-lg p-1 transition hover:bg-white/10"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationManager, type Notification } from "@/lib/notifications";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/30 bg-red-500/10 text-red-200",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
};

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          const colorClasses = colors[notification.type];

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`rounded-xl border ${colorClasses} p-4 shadow-2xl backdrop-blur-md`}
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                  <p className="text-xs opacity-90">{notification.message}</p>
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className="mt-2 text-xs font-medium underline hover:no-underline"
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => notificationManager.dismiss(notification.id)}
                  className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
                  aria-label="Fermer la notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// lib/notifications.ts - Système de notifications amélioré

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // en ms, undefined = pas d'auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationManager {
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private notifications: Notification[] = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  show(notification: Omit<Notification, "id">) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // 5s par défaut
    };

    this.notifications.push(newNotification);
    this.notify();

    // Auto-dismiss si duration est définie
    if (newNotification.duration) {
      setTimeout(() => {
        this.dismiss(id);
      }, newNotification.duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  dismissAll() {
    this.notifications = [];
    this.notify();
  }

  success(title: string, message: string, options?: { duration?: number; action?: Notification["action"] }) {
    return this.show({ type: "success", title, message, ...options });
  }

  error(title: string, message: string, options?: { duration?: number; action?: Notification["action"] }) {
    return this.show({ type: "error", title, message, duration: 7000, ...options }); // Erreurs plus longues
  }

  warning(title: string, message: string, options?: { duration?: number; action?: Notification["action"] }) {
    return this.show({ type: "warning", title, message, ...options });
  }

  info(title: string, message: string, options?: { duration?: number; action?: Notification["action"] }) {
    return this.show({ type: "info", title, message, ...options });
  }
}

export const notificationManager = new NotificationManager();

// lib/logger.ts - Système de logging structuré
// Remplace les console.log/error par un système centralisé

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private get isDevelopment() {
    return process.env.NODE_ENV === "development";
  }

  private get isProduction() {
    return process.env.NODE_ENV === "production";
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    if (this.isDevelopment || process.env.NODE_ENV === "test") {
      console.error(this.formatMessage("error", message, errorContext));
    }

    // En production, envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    if (this.isProduction) {
      // TODO: Intégrer Sentry ou autre service
      // Sentry.captureException(error, { extra: errorContext });
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isProduction || process.env.NODE_ENV === "test") {
      console.warn(this.formatMessage("warn", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment || process.env.NODE_ENV === "test") {
      console.log(this.formatMessage("info", message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment || process.env.NODE_ENV === "test") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

export const logger = new Logger();

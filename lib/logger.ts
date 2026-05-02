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

  private async sendToDiscord(level: LogLevel, message: string, context?: LogContext) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl || (this.isDevelopment && !message.includes("[SECURITY_TEST]"))) return;

    try {
      // ... (reste de la méthode sendToDiscord inchangé) ...
      const color = level === "error" ? 0xff0000 : 0xffa500;
      const title = level === "error" ? "🚨 Error Detected" : "⚠️ Security Alert";

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title,
              description: message,
              color,
              fields: context 
                ? Object.entries(context).map(([key, value]) => ({
                    name: key,
                    value: typeof value === "string" ? value : JSON.stringify(value),
                    inline: true
                  }))
                : [],
              timestamp: new Date().toISOString(),
              footer: { text: "TheCall Security System" }
            }
          ]
        })
      });
    } catch (err) {
      console.error("Failed to send notification to Discord", err);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 500),
          },
        }
      : context;

    if (this.isDevelopment || process.env.NODE_ENV === "test") {
      console.error(this.formatMessage("error", message, errorContext));
    }

    if (this.isProduction) {
      this.sendToDiscord("error", message, errorContext);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isProduction || process.env.NODE_ENV === "test") {
      console.warn(this.formatMessage("warn", message, context));
    }

    const isSecurityAlert = message.includes("[ADMIN]") || 
                            message.includes("[RateLimit]");

    if (this.isProduction && isSecurityAlert) {
      this.sendToDiscord("warn", message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (process.env.VERBOSE_LOGS === "true") {
      console.log(this.formatMessage("info", message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.VERBOSE_LOGS === "true") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

export const logger = new Logger();

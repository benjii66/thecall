// lib/retry.ts - Logique de retry avec exponential backoff

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  factor: 2,
  retryable: () => true,
};

/**
 * Retry une fonction avec exponential backoff
 * 
 * @example
 * ```typescript
 * const data = await retry(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative ou si l'erreur n'est pas retryable, throw
      if (attempt === opts.maxRetries || !opts.retryable(error)) {
        throw error;
      }

      // Calculer le délai avec exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.factor, attempt),
        opts.maxDelayMs
      );

      // Attendre avant de réessayer
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry spécifique pour les erreurs réseau (429, 500, 502, 503, 504)
 */
export function isNetworkRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // Retry sur rate limit, server errors, et timeouts
    return [429, 500, 502, 503, 504].includes(status);
  }
  return false;
}

/**
 * Wrapper pour retry avec logique réseau par défaut
 */
export async function retryNetwork<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, "retryable"> = {}
): Promise<T> {
  return retry(fn, {
    ...options,
    retryable: isNetworkRetryable,
  });
}

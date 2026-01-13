"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { showToast } from "./Toast";

export function ErrorDisplay({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  const isApiKeyError = error.includes("API key") || error.includes("apikey");

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-200">
            Erreur de récupération des données
          </h3>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          
          {isApiKeyError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-black/40 p-4">
              <p className="text-xs font-semibold text-red-200 mb-2">
                Solution :
              </p>
              <ol className="text-xs text-red-100/70 space-y-1 list-decimal list-inside">
                <li>Vérifie que <code className="px-1.5 py-0.5 rounded bg-black/60 text-red-200">RIOT_API_KEY</code> est défini dans <code className="px-1.5 py-0.5 rounded bg-black/60 text-red-200">.env.local</code></li>
                <li>Récupère une nouvelle clé sur <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer" className="underline text-red-200 hover:text-red-100">developer.riotgames.com</a></li>
                <li>Redémarre le serveur après modification</li>
              </ol>
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

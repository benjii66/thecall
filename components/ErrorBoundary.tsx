"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary React pour capturer les erreurs de rendu
 * et afficher un fallback UI gracieux
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur (sera envoyé à Sentry en production)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      // Fallback: console.error si pas de logger fourni
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">
            Une erreur est survenue
          </h2>
          <p className="mb-4 text-center text-sm text-white/70">
            {this.state.error?.message || "Une erreur inattendue s'est produite"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook pour utiliser Error Boundary dans les composants fonctionnels
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

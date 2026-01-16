"use client";

/**
 * Skip Link pour améliorer l'accessibilité au clavier
 * Permet aux utilisateurs de lecteurs d'écran de sauter la navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#05060b]"
    >
      Aller au contenu principal
    </a>
  );
}

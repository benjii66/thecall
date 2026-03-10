// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";
import { NotificationSystem } from "@/components/NotificationSystem";
import { LanguageProvider } from "@/lib/language";
import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLink } from "@/components/SkipLink";
import { Footer } from "@/components/Footer";
import { validateEnv } from "@/lib/env";

// Valider les variables d'environnement au démarrage
// En production, cela lancera une erreur explicite si des vars manquent
if (typeof window === "undefined") {
  try {
    validateEnv();
  } catch (error) {
    // En développement, on peut continuer mais logger l'erreur
    if (process.env.NODE_ENV === "development") {
      console.warn("Variables d'environnement manquantes:", error);
    } else {
      // En production, on doit avoir toutes les vars
      throw error;
    }
  }
}

export const metadata: Metadata = {
  title: "The Call — League of Legends Post-Game Coaching",
  description: "Stop spamming games. TheCall identifies the exact turning point of your LoL matches and gives you a concrete action plan for the next level.",
  keywords: ["League of Legends", "LoL", "Coaching", "Analysis", "Macro", "Riot Games", "Match Breakdown"],
  openGraph: {
    title: "The Call — Master the Macro",
    description: "Your precision LoL analyst. See where the game turns and how to take control.",
    url: "https://thecall.tech",
    siteName: "The Call",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Call - League of Legends Coaching",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Call — LoL Strategic Analysis",
    description: "Understand the why, not just the stats. Precision coaching for Bronze to Gold players.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#05060b] text-white antialiased">
        <SkipLink />
        <ErrorBoundary>
          <LanguageProvider>
            <main id="main-content">
              {children}
            </main>
            <ToastContainer />
            <NotificationSystem />
            <CookieConsent />
            <Footer />
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

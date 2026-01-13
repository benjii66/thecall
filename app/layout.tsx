// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";
import { LanguageProvider } from "@/lib/language";

export const metadata: Metadata = {
  title: "The Call",
  description: "LoL match breakdown (timeline, duel, builds, audit).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#05060b] text-white antialiased">
        <LanguageProvider>
          {children}
          <ToastContainer />
        </LanguageProvider>
      </body>
    </html>
  );
}

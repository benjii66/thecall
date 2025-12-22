// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}

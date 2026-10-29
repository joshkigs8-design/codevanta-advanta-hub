import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "CodeVanta Advanta Hub — Curated Developer Resources & Membership",
  description:
    "Discover verified free APIs, AI models, developer hosting tiers, student benefits, and production blueprints operated by CodeVanta Ventures.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/favicon.svg" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#080a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-hub-bg text-hub-text-primary antialiased flex flex-col justify-between selection:bg-hub-gold/30 selection:text-hub-gold">
        <div>
          <Navbar />
          <main className="w-full">{children}</main>
        </div>
        <Footer />
        <Chatbot />
        <CookieConsent />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import CookieConsent from "@/components/CookieConsent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.codevanta.online";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "CodeVanta Advanta Hub — Curated Developer Resources, Free APIs & AI Tools",
    template: "%s | CodeVanta Advanta Hub",
  },
  description:
    "Discover 100+ verified free APIs, local AI models (Ollama, DeepSeek), cloud tiers, Kenyan developer fintech tools (M-Pesa Daraja), MovieBox-TUI, and production starter blueprints.",
  applicationName: "CodeVanta Advanta Hub",
  authors: [{ name: "CodeVanta Ventures", url: baseUrl }],
  creator: "CodeVanta Ventures",
  publisher: "CodeVanta Ventures",
  keywords: [
    "developer resources",
    "free developer apis",
    "free hosting tiers",
    "free tier database",
    "local llm guide",
    "ollama windows setup",
    "deepseek coder",
    "moviebox-tui",
    "vlc iptv m3u",
    "iptv-org live streams",
    "daraja m-pesa api kenya",
    "kenyan software developer hub",
    "codevanta advanta hub",
    "student developer pack",
    "nextjs blueprints",
    "ai coding agents",
    "opencode",
    "claude code",
    "cybersecurity labs",
    "nairobi tech",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "en-KE": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "CodeVanta Advanta Hub",
    title: "CodeVanta Advanta Hub — Curated Developer Resources & Membership",
    description:
      "Discover 100+ verified free APIs, local AI models, developer hosting tiers, Kenyan fintech tools, and production blueprints operated by CodeVanta Ventures.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeVanta Advanta Hub — Curated Developer Resources",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeVanta Advanta Hub — Curated Developer Resources & Membership",
    description:
      "Verified free APIs, local AI models, developer hosting tiers, Kenyan fintech, and production blueprints.",
    creator: "@codevanta",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "KE-30",
    "geo.placename": "Nairobi, Kenya",
    "geo.position": "-1.2921;36.8219",
    ICBM: "-1.2921, 36.8219",
    "revisit-after": "1 days",
    rating: "General",
    distribution: "Global",
    target: "all",
  },
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "CodeVanta Ventures",
      url: baseUrl,
      logo: `${baseUrl}/favicon.svg`,
      description:
        "Developer ecosystem providing curated APIs, local AI deployment guides, open-source blueprints, and Kenyan payment gateway integrations.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "technical support",
        email: "support@codevanta.online",
      },
      sameAs: ["https://github.com/joshkigs8-design/codevanta-advanta-hub"],
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "CodeVanta Advanta Hub",
      description:
        "The curated developer resource platform for free APIs, local LLMs, Kenyan M-Pesa fintech integrations, and production templates.",
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      inLanguage: ["en-US", "en-KE"],
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/directory?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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

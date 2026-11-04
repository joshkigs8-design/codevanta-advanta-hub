import { Metadata } from "next";
import { Suspense } from "react";
import ToolsClient from "./ToolsClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Smart Utilities — QR Code, M-Pesa Tariffs & Image Tools | CodeVanta",
  description:
    "Free everyday web utilities: Generate custom QR codes for Wi-Fi and WhatsApp, calculate exact Kenyan Safaricom M-Pesa transfer & withdrawal fees with 'Tuma na ya kutoa', and compress images locally in your browser with zero data uploads.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "Free Smart Utilities — QR Code Generator, M-Pesa Calculator & Image Compressor",
    description:
      "Everyday privacy-friendly tools for everyone: WiFi/WhatsApp QR codes, updated 2024–2026 M-Pesa tariffs with 'Tuma na ya kutoa', and in-browser image compression.",
    url: "https://www.codevanta.online/tools",
  },
};

export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-hub-gold" />
        </div>
      }
    >
      <ToolsClient />
    </Suspense>
  );
}


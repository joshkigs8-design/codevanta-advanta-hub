"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Wrench,
  QrCode,
  Banknote,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Tv,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import QrCodeGenerator from "@/components/tools/QrCodeGenerator";
import MpesaCalculator from "@/components/tools/MpesaCalculator";
import ImageCompressor from "@/components/tools/ImageCompressor";

type ActiveTab = "qr" | "mpesa" | "compress";

export default function ToolsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as ActiveTab | null;
  const [activeTab, setActiveTab] = useState<ActiveTab>("qr");

  useEffect(() => {
    if (tabParam && ["qr", "mpesa", "compress"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    router.replace(`/tools?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Everyday Web Utilities &bull; 100% Free &bull; No Login Required</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          CodeVanta <span className="shimmer-gold">Smart Utilities</span>
        </h1>

        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl mx-auto leading-relaxed">
          Fast, privacy-first web utilities designed for everyday use. Generate permanent custom QR codes,
          calculate official Kenyan M-Pesa transfer &amp; withdrawal charges, or compress heavy images directly inside your browser.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Private (No File Uploads)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Client-Side Speed</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300">
            <Banknote className="w-3.5 h-3.5 text-blue-400" />
            <span>Official 2024–2026 M-Pesa Rates</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-center">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10 max-w-2xl w-full">
          <button
            onClick={() => handleTabChange("qr")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "qr"
                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-gold-glow"
                : "text-hub-text-secondary hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span className="truncate">QR Generator</span>
          </button>

          <button
            onClick={() => handleTabChange("mpesa")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "mpesa"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/50"
                : "text-hub-text-secondary hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span className="truncate">M-Pesa Calculator</span>
          </button>

          <button
            onClick={() => handleTabChange("compress")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "compress"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-950/50"
                : "text-hub-text-secondary hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Image Compressor</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-300">
        {activeTab === "qr" && <QrCodeGenerator />}
        {activeTab === "mpesa" && <MpesaCalculator />}
        {activeTab === "compress" && <ImageCompressor />}
      </div>

      {/* Cross-Promotion Footers: Downloader Codes + Referrals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/[0.08]">
        <Link
          href="/downloader-codes"
          className="glass-panel rounded-2xl p-6 border-white/10 hover:border-amber-400/40 transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-hub-gold shrink-0 group-hover:scale-105 transition-transform">
            <Tv className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Android TV &amp; Firestick Codes</span>
              <ArrowRight className="w-3.5 h-3.5 text-hub-gold group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-xs text-hub-text-secondary">
              Browse 60 verified short codes for VLC, Kodi, SmartTube, TROYPOINT Toolbox, and streaming APKs.
            </p>
          </div>
        </Link>

        <Link
          href="/referrals"
          className="glass-panel rounded-2xl p-6 border-white/10 hover:border-emerald-500/40 transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Earn 50% Referral Commission</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-xs text-hub-text-secondary">
              Invite friends to CodeVanta and receive instant payouts directly to your M-Pesa or bank wallet.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}


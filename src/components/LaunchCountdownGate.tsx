"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  Zap,
  Lock,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
} from "lucide-react";

// Default launch target: Tonight, November 4, 2026 at 8:00 PM EAT (UTC+3)
const DEFAULT_LAUNCH_ISO = "2026-11-04T20:00:00+03:00";

interface TimeRemaining {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

function calculateTimeRemaining(targetTimeMs: number): TimeRemaining {
  const now = Date.now();
  const diff = targetTimeMs - now;

  if (diff <= 0) {
    return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { totalMs: diff, hours, minutes, seconds, isLive: false };
}

export default function LaunchCountdownGate() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const targetTimeMs = React.useMemo(() => {
    const launchStr = process.env.NEXT_PUBLIC_LAUNCH_TIME || DEFAULT_LAUNCH_ISO;
    const parsed = new Date(launchStr).getTime();
    return isNaN(parsed) ? new Date(DEFAULT_LAUNCH_ISO).getTime() : parsed;
  }, []);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetTimeMs)
  );

  useEffect(() => {
    setMounted(true);
    // Check if admin preview session is already active
    if (typeof window !== "undefined") {
      const isPreview = sessionStorage.getItem("cv_launch_preview") === "true";
      if (isPreview) {
        setAdminBypass(true);
      }
    }

    const interval = setInterval(() => {
      const updated = calculateTimeRemaining(targetTimeMs);
      setTimeRemaining(updated);

      // Trigger automatic opening celebration when the clock strikes 8:00 PM
      if (updated.isLive) {
        setJustUnlocked(true);
        const timer = setTimeout(() => {
          setJustUnlocked(false);
        }, 4000);
        clearInterval(interval);
        return () => clearTimeout(timer);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimeMs]);

  // Never block admin console routes
  if (!mounted || pathname.startsWith("/admin")) {
    return null;
  }

  // If already live and not in transition celebration, allow immediate open access
  if (timeRemaining.isLive && !justUnlocked) {
    return null;
  }

  // If admin activated preview mode, hide the gate
  if (adminBypass && !justUnlocked) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-hub-gold/10 border border-hub-gold/40 text-hub-gold text-xs font-mono shadow-xl backdrop-blur-md">
        <Eye className="w-3.5 h-3.5" />
        <span>Admin Preview Mode Active (Opening at 8:00 PM EAT)</span>
        <button
          onClick={() => {
            sessionStorage.removeItem("cv_launch_preview");
            setAdminBypass(false);
          }}
          className="ml-2 underline hover:text-white transition-colors"
        >
          Exit Preview
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText("LAUNCHDAY");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEnableBypass = () => {
    sessionStorage.setItem("cv_launch_preview", "true");
    setAdminBypass(true);
  };

  const padZero = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between overflow-y-auto bg-hub-bg text-hub-text-primary px-4 py-8 sm:p-12 select-none backdrop-blur-xl">
      {/* Background ambient futuristic lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-hub-gold/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-amber-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Top Bar Header */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hub-gold to-amber-600 flex items-center justify-center shadow-lg shadow-hub-gold/20">
            <Zap className="w-5 h-5 text-hub-bg font-bold" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              CodeVanta <span className="text-hub-gold">Advanta Hub</span>
            </span>
            <span className="block text-[11px] font-mono tracking-wider text-hub-muted uppercase">
              Developer Ecosystem & Architecture
            </span>
          </div>
        </div>

        <Link
          href="/admin/login"
          className="text-xs font-mono text-hub-muted hover:text-hub-gold transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hub-border hover:border-hub-gold/40 bg-hub-surface/40 backdrop-blur"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Login</span>
        </Link>
      </div>

      {/* Central Launch Countdown Content */}
      <div className="relative z-10 max-w-3xl mx-auto w-full my-auto text-center py-8 sm:py-12">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hub-gold/10 border border-hub-gold/30 text-hub-gold text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm shadow-hub-gold/10 animate-pulse">
          <Clock className="w-4 h-4" />
          <span>Official Public Launch • Tonight at 8:00 PM EAT</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-4">
          The Developer Hub Unlocks{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-hub-gold via-amber-300 to-amber-500">
            Tonight at 8:00 PM
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-hub-muted mb-10 leading-relaxed font-light">
          We are synchronizing the final directory registries, verified developer APIs, local AI blueprints, and M-Pesa fintech integrations. At exactly 8:00 PM, the gateway will open automatically.
        </p>

        {/* Timer Box Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto mb-10">
          {/* Hours */}
          <div className="relative group p-4 sm:p-6 rounded-2xl bg-hub-surface/80 border border-hub-border group-hover:border-hub-gold/40 shadow-xl backdrop-blur-md">
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white group-hover:text-hub-gold transition-colors">
              {padZero(timeRemaining.hours)}
            </div>
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-hub-muted mt-1 block">
              Hours
            </span>
          </div>

          {/* Minutes */}
          <div className="relative group p-4 sm:p-6 rounded-2xl bg-hub-surface/80 border border-hub-border group-hover:border-hub-gold/40 shadow-xl backdrop-blur-md">
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white group-hover:text-hub-gold transition-colors">
              {padZero(timeRemaining.minutes)}
            </div>
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-hub-muted mt-1 block">
              Minutes
            </span>
          </div>

          {/* Seconds */}
          <div className="relative group p-4 sm:p-6 rounded-2xl bg-hub-surface/80 border border-hub-gold/30 shadow-xl shadow-hub-gold/5 backdrop-blur-md">
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-hub-gold">
              {padZero(timeRemaining.seconds)}
            </div>
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-hub-gold/70 mt-1 block">
              Seconds
            </span>
          </div>
        </div>

        {/* Launchday VIP Free Pass Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-hub-surface via-hub-surface/90 to-hub-gold/5 border border-hub-gold/30 max-w-xl mx-auto shadow-lg mb-8 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-hub-gold/15 border border-hub-gold/40 flex items-center justify-center shrink-0 mt-0.5 text-hub-gold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Launchday VIP Free Pass</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-hub-gold/20 text-hub-gold font-mono uppercase">
                  First 5 Only
                </span>
              </div>
              <p className="text-xs text-hub-muted mt-0.5 leading-snug">
                First 5 developers to enter promo code <span className="text-white font-mono font-semibold">LAUNCHDAY</span> at 8:00 PM get instant lifetime VIP Architecture access.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyCode}
            className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-hub-gold hover:bg-amber-400 text-hub-bg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied Code!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy LAUNCHDAY</span>
              </>
            )}
          </button>
        </div>

        {/* Live Auto-Opening Notification */}
        {justUnlocked && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/40 text-green-400 max-w-md mx-auto mb-6 flex items-center justify-center gap-2 text-sm font-semibold animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span>🎉 It&apos;s 8:00 PM! Opening CodeVanta Advanta Hub...</span>
          </div>
        )}

        {/* Features Teaser Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-hub-muted font-mono">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-hub-surface/50 border border-hub-border">
            <ShieldCheck className="w-3.5 h-3.5 text-hub-gold" /> 100+ Verified Developer APIs
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-hub-surface/50 border border-hub-border">
            <Zap className="w-3.5 h-3.5 text-hub-gold" /> Local AI (Ollama & DeepSeek)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-hub-surface/50 border border-hub-border">
            <Sparkles className="w-3.5 h-3.5 text-hub-gold" /> M-Pesa Daraja Payout Engine
          </span>
        </div>
      </div>

      {/* Footer Bottom Bar with Admin Preview Bypass */}
      <div className="relative z-10 max-w-5xl mx-auto w-full pt-6 border-t border-hub-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-hub-muted">
        <div>
          <span>&copy; {new Date().getFullYear()} CodeVanta Ventures. Nairobi, Kenya.</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleEnableBypass}
            className="text-hub-muted/70 hover:text-hub-gold transition-colors flex items-center gap-1 text-[11px] font-mono underline decoration-dashed"
            title="Preview platform before official 8:00 PM launch"
          >
            <Eye className="w-3 h-3" />
            <span>Platform Preview (Staff/Admin)</span>
          </button>
        </div>
      </div>
    </div>
  );
}


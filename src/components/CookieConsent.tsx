"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been recorded
    const consent = localStorage.getItem("cv_cookie_consent");
    if (!consent) {
      // Small entrance delay for smooth UX
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }

    // If accepted, check for pending referral parameter in URL
    if (consent === "accepted") {
      persistReferralParam();
    }
  }, []);

  const persistReferralParam = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref && /^CV[A-Z0-9]{4,10}$/i.test(ref)) {
        const cleanRef = ref.toUpperCase().trim();
        document.cookie = `cv_ref_code=${cleanRef}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        localStorage.setItem("cv_ref_code", cleanRef);
      }
    } catch {
      // Ignore in non-browser or restricted environments
    }
  };

  const handleAccept = () => {
    localStorage.setItem("cv_cookie_consent", "accepted");
    document.cookie = `cv_cookie_consent=accepted; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    persistReferralParam();
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cv_cookie_consent", "declined");
    document.cookie = `cv_cookie_consent=declined; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    // Clear any non-essential cookies
    document.cookie = "cv_ref_code=; path=/; max-age=0";
    localStorage.removeItem("cv_ref_code");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in no-print"
    >
      <div className="rounded-2xl bg-hub-surface-card/95 backdrop-blur-2xl border border-white/15 p-5 shadow-2xl shadow-black/80 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-hub-gold/20 border border-hub-gold/40 flex items-center justify-center text-hub-gold shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Cookie &amp; Privacy Preferences
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>GDPR &amp; Kenya DPA Compliant</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleDecline}
            className="p-1 rounded-lg text-hub-text-muted hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-hub-text-secondary leading-relaxed">
          We use strictly essential cookies for authenticated sessions and M-Pesa checkouts, and optional cookies to remember your referral attribution and preferences. You can review our{" "}
          <Link href="/privacy" className="text-hub-gold underline hover:text-white transition-colors">
            Privacy Policy
          </Link>.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-hub-gold hover:bg-hub-gold-hover text-white transition-all active:scale-95 shadow-md"
          >
            Accept All
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface PromoCodeRedeemBoxProps {
  onSuccess?: (planSlug: string) => void;
  className?: string;
}

export default function PromoCodeRedeemBox({ onSuccess, className = "" }: PromoCodeRedeemBoxProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/promocodes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please sign in or create an account to redeem your promo code.");
        }
        throw new Error(data.error || "Failed to redeem promo code.");
      }

      setSuccessMessage(data.message);
      setCode("");
      if (onSuccess) {
        onSuccess(data.planSlug);
      } else {
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-r from-hub-gold/10 via-white/[0.03] to-purple-500/10 border border-hub-gold/30 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl ${className}`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-hub-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-gold/20 border border-hub-gold/30 text-xs font-mono text-hub-gold">
          <Ticket className="w-3.5 h-3.5" />
          <span>LAUNCHDAY FREE PASS REDEMPTION</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Have an Early Access Promo Code?
        </h3>
        <p className="text-xs sm:text-sm text-hub-text-secondary">
          Enter your launchday or community promotional code below to instantly activate free Pro or VIP architecture membership on your account.
        </p>

        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER PROMO CODE (e.g. LAUNCHDAY)"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white font-mono text-sm tracking-wider uppercase placeholder:text-hub-text-muted focus:outline-none focus:border-hub-gold transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold font-mono uppercase bg-hub-gold text-white hover:bg-hub-gold-hover disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-hub-gold/20 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Redeem Pass</span>
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            {error.includes("sign in") && (
              <button
                onClick={() => router.push("/login")}
                className="underline text-white font-bold ml-1 hover:text-hub-gold"
              >
                Sign In
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { Lock, Mail, User, ArrowRight, Loader2, AlertCircle, Share2, ShieldCheck } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refParam || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
    } else {
      try {
        const storedRef = localStorage.getItem("cv_ref_code");
        if (storedRef) {
          setReferralCode(storedRef.toUpperCase());
        }
      } catch {
        // ignore
      }
    }
  }, [refParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error during account registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Free Developer Account</h1>
          <p className="text-xs text-hub-text-secondary">
            Join CodeVanta Advanta Hub for verified APIs, AI tools, and blueprints.
          </p>
        </div>

        {/* Referral Attribution Banner */}
        {referralCode && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Invited via referral code: <strong className="font-mono text-white">{referralCode}</strong>
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Kiprono"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">
              Referral Code (Optional)
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. CV1A2B"
              className="w-full px-3.5 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-xs text-white font-mono uppercase focus:outline-none focus:border-hub-gold"
            />
          </div>

          <div className="text-[11px] text-hub-text-muted flex items-start gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              By registering, you agree to our Terms of Service and Privacy Policy. You are never obligated to recruit others.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-bold text-sm bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-hub-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-hub-gold font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-hub-gold">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

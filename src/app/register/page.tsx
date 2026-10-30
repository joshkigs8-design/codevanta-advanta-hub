"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Share2,
  ShieldCheck,
} from "lucide-react";
import {
  registerWithEmail,
  loginWithGoogle,
  getFirebaseErrorMessage,
} from "@/lib/firebaseAuth";
import { isFirebaseConfigured } from "@/lib/firebase";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refParam || "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      if (isFirebaseConfigured()) {
        try {
          await registerWithEmail(
            email,
            password,
            fullName,
            referralCode.trim() || undefined
          );
          router.push("/verify-email?new=true");
          router.refresh();
          return;
        } catch (firebaseErr: any) {
          setError(getFirebaseErrorMessage(firebaseErr?.code || ""));
          return;
        }
      }

      // Fallback direct backend registration
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

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      await loginWithGoogle(referralCode.trim() || undefined);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(getFirebaseErrorMessage(err?.code || ""));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create Free Developer Account
          </h1>
          <p className="text-xs text-hub-text-secondary">
            Join CodeVanta Hub for verified APIs, AI tools, and blueprints.
          </p>
        </div>

        {/* Referral Attribution Banner */}
        {referralCode && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Invited via referral code:{" "}
              <strong className="font-mono text-white">{referralCode}</strong>
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-hub-gold" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Sign up with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-hub-border w-full" />
          <span className="bg-hub-surface px-3 text-[11px] font-mono text-hub-text-muted uppercase tracking-wider absolute">
            or email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">
              Full Name
            </label>
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
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">
              Email Address
            </label>
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
            disabled={loading || googleLoading}
            className="w-full py-2.5 rounded-lg font-bold text-sm bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  loginWithEmail,
  loginWithGoogle,
  resetUserPassword,
  getFirebaseErrorMessage,
} from "@/lib/firebaseAuth";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = cleanEmail === "joshkigs8@gmail.com";

    try {
      if (isFirebaseConfigured()) {
        try {
          await loginWithEmail(cleanEmail, password);
          router.push(isAdmin ? "/admin" : "/dashboard");
          router.refresh();
          return;
        } catch (firebaseErr: any) {
          console.warn("Firebase login failed, trying backend authentication:", firebaseErr?.code);
          
          // Try local backend login fallback
          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: cleanEmail, password }),
            });
            const data = await res.json();
            if (res.ok) {
              const targetRoute = data.user?.role === "admin" || isAdmin ? "/admin" : "/dashboard";
              router.push(targetRoute);
              router.refresh();
              return;
            }
          } catch {
            // ignore
          }

          setError(getFirebaseErrorMessage(firebaseErr?.code || "auth/invalid-credential"));
          return;
        }
      }

      // Fallback direct backend login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
      } else {
        const targetRoute = data.user?.role === "admin" || isAdmin ? "/admin" : "/dashboard";
        router.push(targetRoute);
        router.refresh();
      }
    } catch {
      setError("Network error during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const user = await loginWithGoogle();
      const isAdmin = user.email?.toLowerCase().trim() === "joshkigs8@gmail.com";
      router.push(isAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(getFirebaseErrorMessage(err?.code || ""));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      await resetUserPassword(resetEmail);
      setResetSuccess(
        `Password reset instructions have been dispatched to ${resetEmail}. Please check your inbox.`
      );
    } catch (err: any) {
      setResetError(getFirebaseErrorMessage(err?.code || ""));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sign In to CodeVanta Hub
          </h1>
          <p className="text-xs text-hub-text-secondary">
            Access your saved resources, blueprints, and referral dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
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
          <span>Continue with Google</span>
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-hub-text-secondary">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowResetModal(true);
                }}
                className="text-[11px] text-hub-gold hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 rounded-lg font-bold text-sm bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-hub-text-secondary">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="text-hub-gold font-semibold hover:underline">
            Register free
          </Link>
        </p>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowResetModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl bg-hub-surface-card border border-white/20 p-6 shadow-2xl space-y-4 text-white"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-hub-gold" />
                <span>Reset Account Password</span>
              </h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-hub-text-muted hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-hub-text-secondary leading-relaxed">
              Enter your registered email address. Firebase will send you an official secure link to choose a new password.
            </p>

            {resetSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                {resetError && (
                  <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300">
                    {resetError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-xs text-white focus:outline-none focus:border-hub-gold"
                />
                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail}
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Send Reset Link</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

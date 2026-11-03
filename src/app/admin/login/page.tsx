"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  loginWithEmail,
  loginWithGoogle,
  getFirebaseErrorMessage,
} from "@/lib/firebaseAuth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAdminSuccess = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect") || "/admin";
    router.push(redirect);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Authenticate with Firebase if configured
      if (isFirebaseConfigured()) {
        try {
          await loginWithEmail(cleanEmail, password);
          // Check role from session
          const meRes = await fetch("/api/auth/me");
          const meData = await meRes.json();
          if (meData?.user?.role === "admin" || cleanEmail === "joshkigs8@gmail.com") {
            handleAdminSuccess();
            return;
          } else {
            setError("Access denied: This account does not possess administrator privileges.");
            setLoading(false);
            return;
          }
        } catch (firebaseErr: any) {
          console.warn("Firebase admin sign-in notice, attempting direct authentication:", firebaseErr?.code);
        }
      }

      // 2. Fallback to direct backend verification (/api/auth/login)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid administrator email or password.");
        setLoading(false);
        return;
      }

      if (data.user?.role !== "admin" && cleanEmail !== "joshkigs8@gmail.com") {
        setError("Access denied: Administrator privileges required.");
        setLoading(false);
        return;
      }

      handleAdminSuccess();
    } catch {
      setError("Network connection error. Please verify your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      const cleanEmail = (user.email || "").toLowerCase().trim();
      const isAdmin = cleanEmail === "joshkigs8@gmail.com";

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData?.user?.role !== "admin" && !isAdmin) {
        setError("Access denied: This Google account is not authorized for administrator access.");
        setGoogleLoading(false);
        return;
      }
      handleAdminSuccess();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(getFirebaseErrorMessage(err?.code || ""));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md">
        {/* CodeVanta Admin Shield Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            CodeVanta <span className="text-amber-400">Admin Portal</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Authorized administrator credentials required
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-xs font-medium text-red-200">
              {error}
            </div>
          )}

          {/* 1-Click Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700/80 hover:text-white disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googleLoading ? "Verifying Google Account…" : "Sign In with Google"}
          </button>

          <div className="relative mb-5 flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="absolute bg-zinc-900 px-3 text-[10px] uppercase tracking-wider text-zinc-500">
              or enter password
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-zinc-300"
              >
                Administrator Email
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@codevanta.online"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 transition-colors focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 transition-colors focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-zinc-800/80 pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to CodeVanta Platform</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

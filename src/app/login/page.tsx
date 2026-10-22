"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@codevanta.com");
  const [password, setPassword] = useState("AdminSecurePass2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to Advanta Hub</h1>
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

        {/* Demo Credentials callout */}
        <div className="p-3 rounded-lg bg-hub-forest text-[11px] text-hub-text-secondary border border-hub-gold/25 space-y-1">
          <span className="font-bold text-hub-gold block">Pre-filled Demo Accounts:</span>
          <div>• Admin: <span className="font-mono text-white">admin@codevanta.com</span> / <span className="font-mono text-white">AdminSecurePass2026!</span></div>
          <div>• Member: <span className="font-mono text-white">dev@codevanta.com</span> / <span className="font-mono text-white">MemberPass2026!</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">Email Address</label>
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
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">Password</label>
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
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-bold text-sm bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center justify-center gap-2 active:scale-95"
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
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {
  Mail,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Clock,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  checkEmailVerification,
  resendVerificationEmail,
  getFirebaseErrorMessage,
  logoutUser,
} from "@/lib/firebaseAuth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewSignup = searchParams.get("new") === "true";

  const [userEmail, setUserEmail] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Monitor auth state and initial verification status
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        // If no user is logged in, redirect to login
        router.push("/login?redirect=/verify-email");
        return;
      }

      setUserEmail(currentUser.email || "");

      if (currentUser.emailVerified) {
        setIsVerified(true);
        setStatusMessage({
          type: "success",
          text: "Your email is verified! Redirecting to your dashboard...",
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1800);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Check verification status using Firebase's reload(user)
  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);

    try {
      const verified = await checkEmailVerification();

      if (verified) {
        setIsVerified(true);
        setStatusMessage({
          type: "success",
          text: "Email verified successfully! Welcome to CodeVanta Hub.",
        });
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      } else {
        setStatusMessage({
          type: "info",
          text: "Your email is not verified yet. Please make sure you clicked the link in your email, or wait a few seconds and try again.",
        });
      }
    } catch (err: any) {
      console.error("Verification check failed:", err);
      setStatusMessage({
        type: "error",
        text: getFirebaseErrorMessage(err?.code || "auth/network-request-failed"),
      });
    } finally {
      setChecking(false);
    }
  };

  // Resend verification email with a 60-second cooldown
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setStatusMessage(null);

    try {
      await resendVerificationEmail();
      setCooldown(60); // 60s cooldown to prevent abuse
      setStatusMessage({
        type: "success",
        text: "A fresh verification link has been sent. Please check your inbox and spam folder.",
      });
    } catch (err: any) {
      console.error("Failed to resend verification email:", err);
      const code = err?.code || "";
      if (code === "auth/too-many-requests") {
        setCooldown(120); // Longer cooldown if Firebase rate-limits
        setStatusMessage({
          type: "error",
          text: "Too many verification requests sent. Please wait a couple of minutes before requesting again.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: getFirebaseErrorMessage(code),
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/login");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <BrandLogo />
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-hub-gold/10 border border-hub-gold/30 text-hub-gold mb-2 ring-4 ring-hub-gold/5">
            <Mail className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isVerified ? "Email Verified!" : "Verify Your Email"}
          </h1>
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            {isNewSignup
              ? "Thanks for joining CodeVanta Hub! We sent an activation link to:"
              : "Please verify your email address to unlock all platform features:"}
          </p>
          <div className="px-3 py-1.5 rounded-lg bg-hub-surface-elevated border border-hub-border inline-block">
            <span className="font-mono text-sm font-semibold text-hub-gold break-all">
              {userEmail || "your email address"}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : statusMessage.type === "error"
                ? "bg-rose-950/70 border-rose-800 text-rose-200"
                : "bg-amber-950/70 border-amber-800 text-amber-200"
            }`}
          >
            {statusMessage.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {statusMessage.type === "error" && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            {statusMessage.type === "info" && (
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Action Steps Card */}
        {!isVerified && (
          <div className="p-4 rounded-xl bg-hub-surface-elevated/70 border border-white/5 space-y-2.5 text-xs text-hub-text-secondary">
            <div className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-hub-gold" />
              <span>Three Quick Steps:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] leading-relaxed text-hub-text-muted">
              <li>Open your email inbox (check <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder).</li>
              <li>Click the verification link from <strong>Firebase / CodeVanta Hub</strong>.</li>
              <li>Return here and click <strong>&quot;I&apos;ve Verified My Email&quot;</strong> below.</li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Refresh / Check Verification Status */}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking || isVerified}
            className="w-full py-2.5 px-4 rounded-xl bg-hub-gold hover:bg-hub-gold/90 text-hub-navy font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-hub-gold/10"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Firebase Status...</span>
              </>
            ) : isVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified! Redirecting...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>I&apos;ve Verified My Email</span>
              </>
            )}
          </button>

          {/* Resend Verification Email Button */}
          {!isVerified && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full py-2.5 px-4 rounded-xl border border-hub-border hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-hub-gold" />
                  <span>Sending email...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-hub-text-muted" />
                  <span className="font-mono">Resend available in {cooldown}s</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-hub-gold" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          )}

          {/* Fallback & Navigation Links */}
          <div className="pt-2 flex items-center justify-between text-xs text-hub-text-muted border-t border-hub-border/50">
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-rose-400 transition-colors"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-hub-gold" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}


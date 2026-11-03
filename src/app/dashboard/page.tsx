"use client";
import { getResourceLogo } from '@/lib/resourceImages';
import PromoCodeRedeemBox from '@/components/PromoCodeRedeemBox';
import SafeImage from "@/components/SafeImage";
import ReferralStudio from "@/components/ReferralStudio";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserEntitlements,
} from "@/lib/entitlements";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { syncUserWithFirestoreAndBackend } from "@/lib/firebaseAuth";
import {
  Profile,
  Bookmark,
  WalletAccount,
  WalletLedgerEntry,
  WithdrawalRequest,
  ReferralReward,
  ReferralProgramStatus,
} from "@/types";
import {
  LayoutDashboard,
  Bookmark as BookmarkIcon,
  Share2,
  Wallet,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "bookmarks" | "referrals" | "wallet">("overview");
  const [user, setUser] = useState<Profile | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(true);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Array<Bookmark & { name: string; slug: string; short_description: string; pricing_classification: string; official_website: string; category_name: string }>>([]);

  // Referral Stats
  const [referralStats, setReferralStats] = useState<{
    code: string;
    referralUrl: string;
    clicks: number;
    signupsCount: number;
    qualifiedCount: number;
    programStatus: ReferralProgramStatus;
    rewards: Array<ReferralReward & { referred_name: string; referred_email: string }>;
    shareMessage: string;
  } | null>(null);

  // Wallet
  const [walletData, setWalletData] = useState<{
    wallet: WalletAccount;
    ledger: WalletLedgerEntry[];
    withdrawals: WithdrawalRequest[];
    programStatus: ReferralProgramStatus;
    policy: {
      minimumWithdrawalKes: number;
      feeKes: number;
      payoutsEnabled: boolean;
      statusNotice: string;
    };
  } | null>(null);

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check URL hash for direct tab navigation (e.g. #referrals, #wallet)
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "referrals" || hash === "wallet" || hash === "bookmarks") {
        setActiveTab(hash as "referrals" | "wallet" | "bookmarks");
      }
    }

    // Live Firebase Auth verification status sync
    if (isFirebaseConfigured()) {
      auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser && currentUser.emailVerified) {
          if (isMounted) setUser((prev) => (prev ? { ...prev, email_verified: true } : prev));
          await syncUserWithFirestoreAndBackend(currentUser);
        }
      });
    }

    const initDashboardData = async () => {
      try {
        let meRes = await fetch("/api/auth/me");
        let meData = await meRes.json();

        // If backend session not established yet, check if Firebase client auth exists before redirecting
        if (!meData.authenticated && isFirebaseConfigured()) {
          if (typeof auth.authStateReady === "function") {
            await auth.authStateReady();
          }
          const currentUser = auth.currentUser;
          if (currentUser) {
            await syncUserWithFirestoreAndBackend(currentUser);
            meRes = await fetch("/api/auth/me");
            meData = await meRes.json();
          }
        }

        if (!meData.authenticated) {
          router.push("/login");
          return;
        }

        if (!isMounted) return;
        setUser(meData.user);
        setEntitlements(meData.entitlements);
        setWithdrawPhone(meData.user.phone_number || "0700000001");
        setWithdrawName(meData.user.full_name || "");

        // Fetch remaining data in parallel
        Promise.all([
          fetch("/api/bookmarks").then((res) => res.json()).catch(() => ({ bookmarks: [] })),
          fetch("/api/referrals/my-stats").then((res) => res.json()).catch(() => null),
          fetch("/api/wallet").then((res) => res.json()).catch(() => null)
        ]).then(([bookmarksRes, statsRes, walletRes]) => {
          if (!isMounted) return;
          if (bookmarksRes?.bookmarks) setBookmarks(bookmarksRes.bookmarks);
          if (statsRes) setReferralStats(statsRes);
          if (walletRes) setWalletData(walletRes);
        }).finally(() => {
          if (isMounted) setLoading(false);
        });

      } catch (err) {
        console.error("Dashboard init error:", err);
        router.push("/login");
      }
    };

    initDashboardData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveBookmark = async (resourceId: string) => {
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource_id: resourceId }),
      });
      setBookmarks((prev) => prev.filter((b) => b.resource_id !== resourceId));
    } catch {}
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawError("");
    setWithdrawSuccess("");

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          phoneNumber: withdrawPhone,
          accountName: withdrawName,
          paymentMethod: "mpesa_b2c",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data.error || "Failed to submit withdrawal");
      } else {
        setWithdrawSuccess(data.message || "Withdrawal submitted");
        setWithdrawAmount("");
        // Refresh wallet
        fetch("/api/wallet")
          .then((r) => r.json())
          .then((w) => setWalletData(w));
      }
    } catch {
      setWithdrawError("Network error while submitting withdrawal");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center text-hub-gold flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-hub-gold/20 border-t-hub-gold animate-spin" />
          <div className="absolute inset-0 rounded-full blur-md bg-hub-gold/20" />
        </div>
        <span className="text-sm font-mono tracking-wider text-hub-gold/90 uppercase">Loading member dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Email Verification Reminder Banner */}
      {user && !user.email_verified && user.role !== "admin" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-amber-950/20 backdrop-blur-xl">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Please verify your email address</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                We sent a link to <strong className="font-mono text-white underline decoration-amber-500/40">{user.email}</strong>. Verifying your email unlocks M-Pesa payouts and secures your account.
              </p>
            </div>
          </div>
          <Link
            href="/verify-email"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black transition-all shrink-0 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <span>Verify Email Now</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel card-specular-edge flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-hub-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hub-gold/20 via-hub-surface-card to-black border border-hub-gold/50 text-hub-gold flex items-center justify-center font-bold text-2xl uppercase shadow-gold-glow">
            {user.full_name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{user.full_name}</h1>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-hub-gold/15 text-hub-gold border border-hub-gold/30 font-semibold shadow-gold-glow">
                {entitlements?.planName || "Public Explorer"}
              </span>
            </div>
            <p className="text-xs text-hub-text-secondary font-mono flex items-center gap-2">
              <span>{user.email}</span>
              <span>•</span>
              <span className="text-hub-text-muted">Country: {user.country}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto justify-end">
          {entitlements?.planSlug === "free" && (
            <Link
              href="/plans"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-hub-gold via-amber-400 to-hub-gold text-hub-forest-dark hover:brightness-110 shadow-gold-glow transition-all active:scale-95"
            >
              Upgrade Membership
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/60 transition-colors shadow-lg shadow-red-950/30"
            >
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-1.5 rounded-2xl glass-panel flex items-center gap-1.5 overflow-x-auto border border-white/[0.08]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-hub-gold/20 to-hub-gold/10 text-hub-gold border border-hub-gold/40 font-bold shadow-gold-glow"
              : "text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview &amp; Entitlements</span>
        </button>

        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "bookmarks"
              ? "bg-gradient-to-r from-hub-gold/20 to-hub-gold/10 text-hub-gold border border-hub-gold/40 font-bold shadow-gold-glow"
              : "text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <BookmarkIcon className="w-4 h-4" />
          <span>Saved Bookmarks ({bookmarks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("referrals")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "referrals"
              ? "bg-gradient-to-r from-hub-gold/20 to-hub-gold/10 text-hub-gold border border-hub-gold/40 font-bold shadow-gold-glow"
              : "text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Referral Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "wallet"
              ? "bg-gradient-to-r from-hub-gold/20 to-hub-gold/10 text-hub-gold border border-hub-gold/40 font-bold shadow-gold-glow"
              : "text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Wallet &amp; Ledger</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl glass-card-interactive card-specular-edge space-y-2 border border-white/[0.08]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-hub-text-muted">Current Plan</span>
              <h3 className="text-2xl font-black text-white">{entitlements?.planName}</h3>
              <p className="text-xs text-hub-text-secondary leading-relaxed">
                {entitlements?.planSlug === "vip"
                  ? "Full VIP access to all blueprints and starter kits."
                  : entitlements?.planSlug === "pro"
                  ? "Pro access to advanced roadmaps & search filters."
                  : entitlements?.planSlug === "basic"
                  ? "Basic member benefits active."
                  : entitlements?.planSlug === "starter"
                  ? "Starter member benefits active (KES 70 lifetime access)."
                  : "Free public explorer tier."}
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card-interactive card-specular-edge space-y-2 border border-emerald-500/20 bg-gradient-to-b from-emerald-950/10 to-transparent">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80">Withdrawable Balance</span>
              <h3 className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                KES {walletData?.wallet.approved_balance.toLocaleString() || "0"}
              </h3>
              <p className="text-xs text-hub-text-secondary font-mono">
                Pending rewards: <span className="text-amber-400">KES {walletData?.wallet.pending_balance.toLocaleString() || "0"}</span>
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card-interactive card-specular-edge space-y-2 border border-hub-gold/20 bg-gradient-to-b from-hub-gold/10 to-transparent">
              <span className="text-[11px] font-mono uppercase tracking-wider text-hub-gold/80">Saved Resources</span>
              <h3 className="text-3xl font-black text-hub-gold font-mono tracking-tight">
                {bookmarks.length} / {entitlements?.maxBookmarks || 3}
              </h3>
              <p className="text-xs text-hub-text-secondary">
                Limit based on your <strong className="text-white">{entitlements?.planName}</strong> tier.
              </p>
            </div>
          </div>

          <PromoCodeRedeemBox onSuccess={() => window.location.reload()} />

          {/* Entitlements Details */}
          <div className="p-6 sm:p-7 rounded-3xl glass-panel card-specular-edge space-y-5 border border-white/[0.08]">
            <h3 className="text-base font-bold text-white tracking-tight">Your Plan Entitlements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white font-medium">Verified Public Resource Directory</span>
              </div>
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${entitlements?.canUseAdvancedSearch ? "bg-white/[0.03] border-white/10 text-white font-medium" : "bg-black/20 border-white/[0.04] text-hub-text-muted"}`}>
                <Check className={`w-4 h-4 shrink-0 ${entitlements?.canUseAdvancedSearch ? "text-emerald-400" : "text-zinc-600"}`} />
                <span>Advanced Search &amp; Multi-Filtering</span>
              </div>
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${entitlements?.canAccessOriginalBlueprints ? "bg-white/[0.03] border-white/10 text-white font-medium" : "bg-black/20 border-white/[0.04] text-hub-text-muted"}`}>
                <Check className={`w-4 h-4 shrink-0 ${entitlements?.canAccessOriginalBlueprints ? "text-emerald-400" : "text-zinc-600"}`} />
                <span>Original Production Blueprints</span>
              </div>
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${entitlements?.canDownloadStarterKits ? "bg-hub-gold/10 border-hub-gold/40 text-hub-gold font-bold shadow-gold-glow" : "bg-black/20 border-white/[0.04] text-hub-text-muted"}`}>
                <Check className={`w-4 h-4 shrink-0 ${entitlements?.canDownloadStarterKits ? "text-hub-gold" : "text-zinc-600"}`} />
                <span>Downloadable Starter Repositories (VIP)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white font-medium">Personal Referral Dashboard</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white font-medium">Up to {entitlements?.maxBookmarks} Bookmarks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKMARKS */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Saved Developer Bookmarks</h3>
            <span className="text-xs font-mono text-hub-text-muted">
              {bookmarks.length} of {entitlements?.maxBookmarks || 3} used
            </span>
          </div>

          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl glass-card-interactive card-specular-edge border border-white/[0.08] flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 p-2 flex items-center justify-center shrink-0 shadow-inner">
                      <SafeImage src={getResourceLogo({ official_website: b.official_website })} fallbackSrc="/icon.svg" alt={`${b.name} logo`} className="w-7 h-7 object-contain" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-hub-gold px-2 py-0.5 rounded-full bg-hub-gold/10 border border-hub-gold/30">
                        {b.category_name}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{b.name}</h4>
                      <p className="text-xs text-hub-text-secondary line-clamp-2 leading-relaxed">{b.short_description}</p>
                      <div className="pt-2 flex items-center gap-3">
                        <a
                          href={b.official_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-hub-gold hover:text-white transition-colors"
                        >
                          <span>Visit Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveBookmark(b.resource_id)}
                    className="p-2 rounded-xl text-hub-text-muted hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Remove from bookmarks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-3xl glass-panel border border-white/[0.08] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-hub-text-muted">
                <BookmarkIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">No bookmarks saved yet</h4>
                <p className="text-xs text-hub-text-secondary max-w-sm mx-auto">
                  Save your favorite tools, blueprints, and platforms for instant 1-click access anytime.
                </p>
              </div>
              <Link
                href="/directory"
                className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold bg-hub-gold text-hub-forest-dark hover:brightness-110 shadow-gold-glow transition-all"
              >
                Browse Directory
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REFERRALS */}
      {activeTab === "referrals" && referralStats && (
        <div className="space-y-6">
          {/* Share Link Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
                  Your Unique Referral Code
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono mt-1 tracking-tight">
                  {referralStats.code}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralStats.referralUrl}
                  className="px-4 py-2.5 rounded-xl bg-hub-base/80 border border-white/10 text-xs text-hub-text-secondary font-mono w-full sm:w-72 select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(referralStats.referralUrl)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-hub-gold text-hub-forest-dark hover:brightness-110 shadow-gold-glow flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>

            {/* 2-Tier Referral Policy notice */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs text-hub-text-muted flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">2-Tier Referral Earnings:</strong> Earn <span className="text-emerald-400 font-semibold">Level 1 Direct</span> rewards when peers subscribe (Starter: KES 20, Basic: KES 50, Pro: KES 100, VIP: KES 150). PLUS earn <span className="text-cyan-400 font-semibold">Level 2 Network</span> bonuses when your direct referrals invite others (Starter: KES 5, Basic: KES 15, Pro: KES 25, VIP: KES 35).
                </div>
              </div>
              <Link
                href="/referral-rules"
                className="text-hub-gold hover:text-white font-mono text-xs shrink-0 font-bold self-end sm:self-center transition-colors"
              >
                View Full Rules &rarr;
              </Link>
            </div>
          </div>

          <ReferralStudio
            fullName={user?.full_name || ""}
            referralCode={referralStats.code}
            referralUrl={referralStats.referralUrl}
          />

          {/* Referral Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-card-interactive card-specular-edge border border-white/[0.08]">
              <span className="text-[11px] font-mono uppercase text-hub-text-muted">Link Clicks</span>
              <p className="text-3xl font-black text-white font-mono mt-1">{referralStats.clicks}</p>
            </div>
            <div className="p-5 rounded-2xl glass-card-interactive card-specular-edge border border-white/[0.08]">
              <span className="text-[11px] font-mono uppercase text-hub-text-muted">Referred Sign-ups</span>
              <p className="text-3xl font-black text-white font-mono mt-1">{referralStats.signupsCount}</p>
            </div>
            <div className="p-5 rounded-2xl glass-card-interactive card-specular-edge border border-emerald-500/20 bg-gradient-to-b from-emerald-950/10 to-transparent">
              <span className="text-[11px] font-mono uppercase text-emerald-400/80">Qualifying Purchases</span>
              <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{referralStats.qualifiedCount}</p>
            </div>
            <div className="p-5 rounded-2xl glass-card-interactive card-specular-edge border border-amber-500/20 bg-gradient-to-b from-amber-950/10 to-transparent">
              <span className="text-[11px] font-mono uppercase text-amber-400/80">Program Mode</span>
              <p className="text-sm font-bold uppercase font-mono mt-2 text-amber-400">
                {referralStats.programStatus.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Referral Reward History */}
          <div className="p-6 sm:p-7 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Attributed Referral Rewards</h3>

            {referralStats.rewards.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] border-b border-white/[0.06] text-hub-text-muted font-mono uppercase">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Tier / Level</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Commission</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {referralStats.rewards.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-hub-text-muted">{r.created_at.split("T")[0]}</td>
                        <td className="py-3 px-4 text-white font-medium">{r.referred_email}</td>
                        <td className="py-3 px-4">
                          {r.tier_level === 2 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-700/40 font-semibold">
                              Level 2 Network
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 font-semibold">
                              Level 1 Direct
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 uppercase font-mono text-hub-gold font-bold">{r.plan_slug}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">KES {r.reward_amount_kes}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                            r.status === "approved"
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-700/50"
                              : r.status === "pending"
                              ? "bg-amber-950/70 text-amber-400 border border-amber-700/50"
                              : "bg-red-950/70 text-red-400 border border-red-700/50"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-hub-text-secondary py-4">
                No referral transactions recorded yet. Share your personal invitation link to start earning rewards.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WALLET & WITHDRAWALS */}
      {activeTab === "wallet" && walletData && (
        <div className="space-y-6">
          {/* Balances & Compliance Status Banner */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-hub-text-muted">Approved Withdrawable Balance</span>
                <div className="text-4xl font-black text-emerald-400 font-mono mt-1 tracking-tight">
                  KES {walletData.wallet.approved_balance.toLocaleString()}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono uppercase tracking-wider text-hub-text-muted">Pending Review Balance</span>
                <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                  KES {walletData.wallet.pending_balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Compliance notice callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 to-black/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-amber-300">
                  Programme Status: {walletData.programStatus.toUpperCase()}
                </span>
                <p className="mt-1 leading-relaxed text-amber-200/80">{walletData.policy.statusNotice}</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Request Form */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Request M-Pesa Withdrawal</h3>
                <p className="text-xs text-hub-text-secondary mt-0.5">
                  Commissions are reviewed and disbursed manually via Paystack Transfer / M-Pesa within 24–48 business hours.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full self-start font-semibold">
                Payout Channel: Paystack Transfer
              </span>
            </div>

            {withdrawSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 text-xs">
                {withdrawSuccess}
              </div>
            )}
            {withdrawError && (
              <div className="p-4 rounded-xl bg-red-950/60 text-red-300 border border-red-700/50 text-xs">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
                  Amount in KES (Min: KES {walletData.policy.minimumWithdrawalKes})
                </label>
                <input
                  type="number"
                  required
                  min={walletData.policy.minimumWithdrawalKes}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-2.5 rounded-xl bg-hub-base/80 border border-white/10 text-sm text-white focus:outline-none focus:border-hub-gold focus:ring-1 focus:ring-hub-gold/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
                  M-Pesa Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full px-4 py-2.5 rounded-xl bg-hub-base/80 border border-white/10 text-sm text-white focus:outline-none focus:border-hub-gold focus:ring-1 focus:ring-hub-gold/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
                  Recipient Account Name
                </label>
                <input
                  type="text"
                  required
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Official ID Name"
                  className="w-full px-4 py-2.5 rounded-xl bg-hub-base/80 border border-white/10 text-sm text-white focus:outline-none focus:border-hub-gold focus:ring-1 focus:ring-hub-gold/50"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={withdrawLoading || (!user.email_verified && user.role !== "admin")}
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-hub-gold text-hub-forest-dark hover:brightness-110 shadow-gold-glow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {withdrawLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Withdrawal Request</span>
                </button>
              </div>
            </form>
          </div>

          {/* Withdrawal Requests History */}
          <div className="p-6 sm:p-7 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Withdrawal Requests &amp; Payout Status</h3>

            {walletData.withdrawals && walletData.withdrawals.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] border-b border-white/[0.06] text-hub-text-muted font-mono uppercase">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Recipient Phone</th>
                      <th className="py-3 px-4">Channel &amp; Ref</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {walletData.withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-hub-text-muted">
                          {w.created_at.split("T")[0]}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-hub-gold">
                          KES {w.net_amount_kes}
                        </td>
                        <td className="py-3 px-4 font-mono text-white">
                          {w.phone_number} ({w.account_name})
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {w.external_transaction_id ? (
                            <span className="text-emerald-400 font-bold">
                              {w.external_transaction_id}
                            </span>
                          ) : (
                            <span className="text-hub-text-muted italic">Processing...</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                              w.status === "paid" || w.status === "approved"
                                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-700/50"
                                : w.status === "rejected" || w.status === "cancelled"
                                ? "bg-red-950/70 text-red-400 border border-red-700/50"
                                : "bg-amber-950/70 text-amber-400 border border-amber-700/50"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-hub-text-secondary py-2">
                No withdrawal payout requests submitted yet.
              </p>
            )}
          </div>

          {/* Append-Only Ledger History */}
          <div className="p-6 sm:p-7 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Append-Only Wallet Audit Ledger</h3>

            {walletData.ledger.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] border-b border-white/[0.06] text-hub-text-muted font-mono uppercase">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Entry Type</th>
                      <th className="py-3 px-4">Delta (KES)</th>
                      <th className="py-3 px-4">Balance After</th>
                      <th className="py-3 px-4">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {walletData.ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-hub-text-muted">{entry.created_at.split("T")[0]}</td>
                        <td className="py-3 px-4 font-mono uppercase text-hub-gold font-semibold">{entry.entry_type}</td>
                        <td className={`py-3 px-4 font-mono font-bold ${entry.amount_kes >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {entry.amount_kes >= 0 ? `+${entry.amount_kes}` : entry.amount_kes}
                        </td>
                        <td className="py-3 px-4 font-mono text-white">KES {entry.balance_after_kes}</td>
                        <td className="py-3 px-4 text-hub-text-secondary">{entry.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-hub-text-secondary py-4">No wallet transactions recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

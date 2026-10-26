"use client";
import { getResourceLogo } from '@/lib/resourceImages';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserEntitlements,
} from "@/lib/entitlements";
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
    // 1. Fetch current user & entitlements
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        setEntitlements(data.entitlements);
        setWithdrawPhone(data.user.phone_number || "0700000001");
        setWithdrawName(data.user.full_name || "");
      })
      .catch(() => router.push("/login"));

    // 2. Fetch bookmarks
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => setBookmarks(data.bookmarks || []))
      .catch(() => {});

    // 3. Fetch referral stats
    fetch("/api/referrals/my-stats")
      .then((res) => res.json())
      .then((data) => setReferralStats(data))
      .catch(() => {});

    // 4. Fetch wallet data
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setWalletData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-hub-gold flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading member dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Top Header */}
      <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-hub-forest-light border border-hub-gold/40 text-hub-gold flex items-center justify-center font-bold text-xl uppercase shadow-gold-glow">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user.full_name}</h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-hub-gold/20 text-hub-gold border border-hub-gold/40 font-bold">
                {entitlements?.planName || "Public Explorer"}
              </span>
            </div>
            <p className="text-xs text-hub-text-muted mt-0.5">{user.email} • Country: {user.country}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {entitlements?.planSlug === "free" && (
            <Link
              href="/plans"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow transition-all"
            >
              Upgrade Membership
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 transition-colors"
            >
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-hub-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-hub-forest text-hub-gold border border-hub-gold/40 font-bold"
              : "text-hub-text-secondary hover:text-white hover:bg-hub-surface"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview &amp; Entitlements
        </button>

        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "bookmarks"
              ? "bg-hub-forest text-hub-gold border border-hub-gold/40 font-bold"
              : "text-hub-text-secondary hover:text-white hover:bg-hub-surface"
          }`}
        >
          <BookmarkIcon className="w-4 h-4" />
          Saved Bookmarks ({bookmarks.length})
        </button>

        <button
          onClick={() => setActiveTab("referrals")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "referrals"
              ? "bg-hub-forest text-hub-gold border border-hub-gold/40 font-bold"
              : "text-hub-text-secondary hover:text-white hover:bg-hub-surface"
          }`}
        >
          <Share2 className="w-4 h-4" />
          Referral Tracking
        </button>

        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "wallet"
              ? "bg-hub-forest text-hub-gold border border-hub-gold/40 font-bold"
              : "text-hub-text-secondary hover:text-white hover:bg-hub-surface"
          }`}
        >
          <Wallet className="w-4 h-4" />
          Wallet &amp; Ledger
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-2">
              <span className="text-xs font-mono uppercase text-hub-text-muted">Current Plan</span>
              <h3 className="text-2xl font-bold text-white">{entitlements?.planName}</h3>
              <p className="text-xs text-hub-text-secondary">
                {entitlements?.planSlug === "vip"
                  ? "Full VIP access to all blueprints and starter kits."
                  : entitlements?.planSlug === "pro"
                  ? "Pro access to advanced roadmaps & search filters."
                  : entitlements?.planSlug === "basic"
                  ? "Basic member benefits active."
                  : "Free public explorer tier."}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-2">
              <span className="text-xs font-mono uppercase text-hub-text-muted">Withdrawable Balance</span>
              <h3 className="text-2xl font-bold text-emerald-400 font-mono">
                KES {walletData?.wallet.approved_balance.toLocaleString() || "0"}
              </h3>
              <p className="text-xs text-hub-text-secondary">
                Pending rewards: KES {walletData?.wallet.pending_balance.toLocaleString() || "0"}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-hub-surface-card border border-hub-border space-y-2">
              <span className="text-xs font-mono uppercase text-hub-text-muted">Saved Resources</span>
              <h3 className="text-2xl font-bold text-hub-gold font-mono">
                {bookmarks.length} / {entitlements?.maxBookmarks || 3}
              </h3>
              <p className="text-xs text-hub-text-secondary">
                Limit based on your {entitlements?.planName} tier.
              </p>
            </div>
          </div>

          {/* Entitlements Details */}
          <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
            <h3 className="text-base font-bold text-white">Your Plan Entitlements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Verified Public Resource Directory</span>
              </div>
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${entitlements?.canUseAdvancedSearch ? "bg-hub-surface-elevated border-hub-border text-hub-text-primary" : "bg-hub-surface-card border-hub-border/50 text-hub-text-muted"}`}>
                <Check className={`w-4 h-4 ${entitlements?.canUseAdvancedSearch ? "text-emerald-400" : "text-zinc-600"}`} />
                <span>Advanced Search &amp; Multi-Filtering</span>
              </div>
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${entitlements?.canAccessOriginalBlueprints ? "bg-hub-surface-elevated border-hub-border text-hub-text-primary" : "bg-hub-surface-card border-hub-border/50 text-hub-text-muted"}`}>
                <Check className={`w-4 h-4 ${entitlements?.canAccessOriginalBlueprints ? "text-emerald-400" : "text-zinc-600"}`} />
                <span>Original Production Blueprints</span>
              </div>
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${entitlements?.canDownloadStarterKits ? "bg-hub-surface-elevated border-hub-gold/50 text-hub-gold font-bold" : "bg-hub-surface-card border-hub-border/50 text-hub-text-muted"}`}>
                <Check className={`w-4 h-4 ${entitlements?.canDownloadStarterKits ? "text-emerald-400" : "text-zinc-600"}`} />
                <span>Downloadable Starter Repositories (VIP)</span>
              </div>
              <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Personal Referral Dashboard</span>
              </div>
              <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Up to {entitlements?.maxBookmarks} Bookmarks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKMARKS */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Saved Developer Bookmarks</h3>
            <span className="text-xs text-hub-text-muted">
              {bookmarks.length} of {entitlements?.maxBookmarks || 3} used
            </span>
          </div>

          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-hub-surface border border-hub-border flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5"><div className="w-10 h-10 rounded-xl bg-hub-surface-elevated border border-white/10 p-1.5 flex items-center justify-center shrink-0"><img src={getResourceLogo({ official_website: b.official_website })} alt="" className="w-6 h-6 object-contain" /></div><div className="space-y-1"><span className="text-[10px] font-mono uppercase text-hub-gold px-2 py-0.5 rounded bg-hub-surface-elevated border border-hub-border">{b.category_name}</span><h4 className="font-bold text-white text-base">{b.name}</h4>
                    <p className="text-xs text-hub-text-secondary line-clamp-2">{b.short_description}</p>
                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={b.official_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-hub-gold hover:underline"
                      >
                        <span>Visit Site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  </div>

                  <button
                    onClick={() => handleRemoveBookmark(b.resource_id)}
                    className="p-1.5 rounded-lg text-hub-text-muted hover:text-red-400 hover:bg-red-950/20"
                    title="Remove from bookmarks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl bg-hub-surface border border-hub-border space-y-3">
              <BookmarkIcon className="w-8 h-8 text-hub-text-muted mx-auto" />
              <p className="text-sm text-hub-text-secondary">No bookmarks saved yet.</p>
              <Link
                href="/directory"
                className="inline-block px-4 py-2 rounded-lg text-xs font-semibold bg-hub-gold text-hub-forest-dark"
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
          <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
                  Your Unique Referral Code
                </span>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {referralStats.code}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralStats.referralUrl}
                  className="px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-xs text-hub-text-secondary font-mono w-64 select-all"
                />
                <button
                  onClick={() => handleCopy(referralStats.referralUrl)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>

            {/* Referral Policy notice */}
            <div className="p-3 rounded-lg bg-hub-bg border border-hub-border text-xs text-hub-text-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Direct Referral Terms:</strong> You earn commission only when an invited user purchases an eligible
                membership plan (Basic: KES 50, Pro: KES 100, VIP: KES 150). No commissions for signups alone. No multi-level schemes.
              </div>
            </div>
          </div>

          {/* Referral Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-hub-surface-card border border-hub-border">
              <span className="text-xs text-hub-text-muted">Link Clicks</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">{referralStats.clicks}</p>
            </div>
            <div className="p-4 rounded-xl bg-hub-surface-card border border-hub-border">
              <span className="text-xs text-hub-text-muted">Referred Sign-ups</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">{referralStats.signupsCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-hub-surface-card border border-hub-border">
              <span className="text-xs text-hub-text-muted">Qualifying Purchases</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{referralStats.qualifiedCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-hub-surface-card border border-hub-border">
              <span className="text-xs text-hub-text-muted">Program Mode</span>
              <p className="text-xs font-bold uppercase font-mono mt-2 text-amber-400">
                {referralStats.programStatus.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Referral Reward History */}
          <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
            <h3 className="text-base font-bold text-white">Attributed Referral Rewards</h3>

            {referralStats.rewards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-hub-border text-hub-text-muted font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3">Commission</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hub-border">
                    {referralStats.rewards.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono text-hub-text-muted">{r.created_at.split("T")[0]}</td>
                        <td className="py-2.5 px-3 text-white">{r.referred_email}</td>
                        <td className="py-2.5 px-3 uppercase font-mono text-hub-gold">{r.plan_slug}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">KES {r.reward_amount_kes}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                            r.status === "approved"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : r.status === "pending"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-red-950 text-red-400 border border-red-800"
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
          <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-hub-text-muted">Approved Withdrawable Balance</span>
                <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                  KES {walletData.wallet.approved_balance.toLocaleString()}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono uppercase text-hub-text-muted">Pending Review Balance</span>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                  KES {walletData.wallet.pending_balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Compliance notice callout */}
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-amber-300">
                  Programme Status: {walletData.programStatus.toUpperCase()}
                </span>
                <p className="mt-1 leading-relaxed">{walletData.policy.statusNotice}</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Request Form */}
          <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
            <h3 className="text-base font-bold text-white">Request M-Pesa Withdrawal</h3>

            {withdrawSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs">
                {withdrawSuccess}
              </div>
            )}
            {withdrawError && (
              <div className="p-3 rounded-lg bg-red-950 text-red-300 border border-red-800 text-xs">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  Amount in KES (Min: KES {walletData.policy.minimumWithdrawalKes})
                </label>
                <input
                  type="number"
                  required
                  min={walletData.policy.minimumWithdrawalKes}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  M-Pesa Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1">
                  Recipient Account Name
                </label>
                <input
                  type="text"
                  required
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Official ID Name"
                  className="w-full px-3 py-2 rounded-lg bg-hub-surface-elevated border border-hub-border text-sm text-white focus:outline-none focus:border-hub-gold"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow flex items-center gap-2"
                >
                  {withdrawLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Withdrawal Request</span>
                </button>
              </div>
            </form>
          </div>

          {/* Append-Only Ledger History */}
          <div className="p-6 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
            <h3 className="text-base font-bold text-white">Append-Only Wallet Audit Ledger</h3>

            {walletData.ledger.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-hub-border text-hub-text-muted font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Entry Type</th>
                      <th className="py-2.5 px-3">Delta (KES)</th>
                      <th className="py-2.5 px-3">Balance After</th>
                      <th className="py-2.5 px-3">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hub-border">
                    {walletData.ledger.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-2.5 px-3 font-mono text-hub-text-muted">{entry.created_at.split("T")[0]}</td>
                        <td className="py-2.5 px-3 font-mono uppercase text-hub-gold">{entry.entry_type}</td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${entry.amount_kes >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {entry.amount_kes >= 0 ? `+${entry.amount_kes}` : entry.amount_kes}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-white">KES {entry.balance_after_kes}</td>
                        <td className="py-2.5 px-3 text-hub-text-secondary">{entry.notes}</td>
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

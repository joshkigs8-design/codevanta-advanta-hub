"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Users,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
  DollarSign,
  TrendingUp,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export default function ReferralsLandingPage() {
  const [calcDirectCount, setCalcDirectCount] = useState(10);
  const [calcNetworkCount, setCalcNetworkCount] = useState(25);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "vip" | "basic" | "starter">("pro");

  const planRates = {
    starter: { name: "Starter Tier", price: 70, direct: 20, network: 5 },
    basic: { name: "Basic Tier", price: 150, direct: 50, network: 15 },
    pro: { name: "Pro Tier", price: 250, direct: 100, network: 25 },
    vip: { name: "VIP Tier", price: 350, direct: 150, network: 35 },
  };

  const currentRate = planRates[selectedPlan];
  const directEarnings = calcDirectCount * currentRate.direct;
  const networkEarnings = calcNetworkCount * currentRate.network;
  const totalEstimatedEarnings = directEarnings + networkEarnings;

  return (
    <div className="min-h-screen bg-hub-base text-hub-text-primary py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CodeVanta Partner &amp; Affiliate Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Earn Real Cash with <br className="hidden sm:inline" />
          <span className="shimmer-gold">2-Tier Developer Referrals</span>
        </h1>

        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl mx-auto leading-relaxed">
          Share curated cloud APIs, developer tools, and blueprints with fellow engineers. Earn instant direct rewards plus secondary network bonuses disbursed directly to your <strong>Safaricom M-Pesa</strong> wallet.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard#referrals"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-gold-glow transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Get Your Referral Link</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Link>

          <Link
            href="/referral-rules"
            className="flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-hub-gold" />
            <span>View Official Rules</span>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Direct Level 1 Rewards</h3>
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            Earn up to <strong>KES 150</strong> per direct subscriber when peers join using your link. Credited immediately upon M-Pesa confirmation.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Level 2 Network Bonus</h3>
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            When developers you referred invite their friends, you earn up to <strong>KES 35</strong> on their network subscribers as well.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Low KES 50 M-Pesa Payout</h3>
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            Request withdrawals once your wallet reaches just <strong>KES 50</strong>. Disbursed directly to your phone via Safaricom M-Pesa.
          </p>
        </div>
      </section>

      {/* Interactive Referral Earnings Calculator */}
      <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-hub-gold/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-hub-gold" />
              <span>Referral Earnings Calculator</span>
            </h2>
            <p className="text-xs text-hub-text-secondary mt-1">
              Estimate your monthly payout based on community size and tier selection.
            </p>
          </div>

          {/* Tier Selector Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
            {(["starter", "basic", "pro", "vip"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedPlan(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase font-mono ${
                  selectedPlan === tier
                    ? "bg-hub-gold text-white shadow-md font-bold"
                    : "text-hub-text-secondary hover:text-white"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">Direct Referrals (Level 1):</span>
              <span className="font-mono text-hub-gold font-bold text-sm">{calcDirectCount} members</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={calcDirectCount}
              onChange={(e) => setCalcDirectCount(parseInt(e.target.value) || 1)}
              className="w-full accent-amber-400"
            />
            <div className="text-[11px] text-hub-text-muted flex justify-between">
              <span>1 member</span>
              <span>100 members</span>
            </div>
            <p className="text-xs font-mono text-emerald-400 pt-1">
              + KES {currentRate.direct} per member = KES {directEarnings.toLocaleString()}
            </p>
          </div>

          <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">Network Referrals (Level 2):</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{calcNetworkCount} members</span>
            </div>
            <input
              type="range"
              min={0}
              max={250}
              value={calcNetworkCount}
              onChange={(e) => setCalcNetworkCount(parseInt(e.target.value) || 0)}
              className="w-full accent-cyan-400"
            />
            <div className="text-[11px] text-hub-text-muted flex justify-between">
              <span>0 members</span>
              <span>250 members</span>
            </div>
            <p className="text-xs font-mono text-cyan-400 pt-1">
              + KES {currentRate.network} per member = KES {networkEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Estimate Callout */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-hub-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-hub-gold uppercase tracking-wider font-bold block">
              Estimated Total Payout
            </span>
            <div className="text-2xl sm:text-4xl font-black text-white font-mono mt-0.5">
              KES {totalEstimatedEarnings.toLocaleString()}{" "}
              <span className="text-xs text-hub-text-muted font-sans font-normal">via M-Pesa</span>
            </div>
            <p className="text-xs text-hub-text-secondary mt-1">
              Based on {calcDirectCount} direct invitees and {calcNetworkCount} network members on {currentRate.name}.
            </p>
          </div>

          <Link
            href="/dashboard#referrals"
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-hub-gold hover:bg-hub-gold-hover text-white transition-all shadow-md active:scale-95 shrink-0"
          >
            Claim Your Referral Link
          </Link>
        </div>
      </section>

      {/* Reward Matrix Table */}
      <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Complete Reward Matrix</h2>
        <p className="text-xs text-hub-text-secondary">
          CodeVanta distributes generous referral bonuses on every plan:
        </p>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/50">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[340px]">
            <thead className="border-b border-white/10 text-hub-gold font-mono uppercase bg-white/[0.04]">
              <tr>
                <th className="py-3 px-4 font-bold">Plan</th>
                <th className="py-3 px-4 font-bold">Price</th>
                <th className="py-3 px-4 font-bold text-emerald-400">Level 1 (Direct)</th>
                <th className="py-3 px-4 font-bold text-cyan-400">Level 2 (Network)</th>
                <th className="py-3 px-4 font-bold text-white">Total Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Starter Tier</td>
                <td className="py-3 px-4">KES 70</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">KES 20</td>
                <td className="py-3 px-4 text-cyan-400 font-bold">KES 5</td>
                <td className="py-3 px-4 text-white">KES 25 (35.7%)</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Basic Tier</td>
                <td className="py-3 px-4">KES 150</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">KES 50</td>
                <td className="py-3 px-4 text-cyan-400 font-bold">KES 15</td>
                <td className="py-3 px-4 text-white">KES 65 (43.3%)</td>
              </tr>
              <tr className="hover:bg-white/[0.02] bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-hub-gold">Pro Tier (Most Popular)</td>
                <td className="py-3 px-4">KES 250</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">KES 100</td>
                <td className="py-3 px-4 text-cyan-400 font-bold">KES 25</td>
                <td className="py-3 px-4 text-white">KES 125 (50.0%)</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-amber-300">VIP Tier</td>
                <td className="py-3 px-4">KES 350</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">KES 150</td>
                <td className="py-3 px-4 text-cyan-400 font-bold">KES 35</td>
                <td className="py-3 px-4 text-white">KES 185 (52.8%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How to Get Started - 3 Simple Steps */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
          How to Start Earning in 3 Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl glass-panel space-y-3">
            <div className="w-8 h-8 rounded-full bg-hub-gold text-white font-bold flex items-center justify-center font-mono text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-white">Sign In &amp; Copy Your Link</h3>
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              Every registered user receives a unique referral code and tracking link inside their{" "}
              <Link href="/dashboard#referrals" className="text-hub-gold underline">Member Dashboard</Link>.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-3">
            <div className="w-8 h-8 rounded-full bg-hub-gold text-white font-bold flex items-center justify-center font-mono text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-white">Share with Developers</h3>
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              Share on WhatsApp groups, tech communities, X/Twitter, LinkedIn, or student developer circles.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-3">
            <div className="w-8 h-8 rounded-full bg-hub-gold text-white font-bold flex items-center justify-center font-mono text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-white">Withdraw via M-Pesa</h3>
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              Request instant disbursement to your Safaricom M-Pesa phone number once your balance hits KES 50.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA Banner */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-transparent border border-hub-gold/40 text-center space-y-4">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Ready to Start Earning?
        </h2>
        <p className="text-xs sm:text-sm text-hub-text-secondary max-w-xl mx-auto">
          Join hundreds of developers earning weekly commissions by expanding the CodeVanta ecosystem.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard#referrals"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-gold-glow transition-all active:scale-95"
          >
            <span>Open Referral Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}


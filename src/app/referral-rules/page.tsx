import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Zap, Users, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "2-Tier Referral Program Rules & Terms | CodeVanta Advanta Hub",
  description: "Official rules and compensation plan for the CodeVanta Advanta Hub 2-Tier Developer Referral Program. Earn direct commissions and secondary network bonuses.",
};

export default function ReferralRulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-hub-gold hover:underline font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-surface border border-hub-gold/30 text-xs font-mono text-hub-gold">
          <Zap className="w-3.5 h-3.5" />
          <span>OFFICIAL PROGRAM GUIDELINES</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          2-Tier Referral Program Rules
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary leading-relaxed max-w-2xl">
          CodeVanta rewards creators and developers who expand our community. Earn direct commissions when your invitees subscribe, plus secondary network bonuses when their referrals subscribe.
        </p>
      </div>

      {/* How 2-Tier Works */}
      <div className="p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-hub-gold" />
          How the 2-Tier Structure Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-hub-surface-card border border-emerald-500/30 space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Level 1: Direct Referral
            </span>
            <h3 className="text-base font-bold text-white">When you refer a friend directly</h3>
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              When someone registers using your unique referral link or code and purchases any membership plan, you earn the direct reward instantly into your approved wallet.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-hub-surface-card border border-cyan-500/30 space-y-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Level 2: Network Bonus
            </span>
            <h3 className="text-base font-bold text-white">When your referral refers someone</h3>
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              When a developer you directly referred invites a peer who purchases a plan, you receive a secondary Level 2 network bonus for having introduced the initial referrer to CodeVanta.
            </p>
          </div>
        </div>

        {/* Visual Example */}
        <div className="p-4 rounded-xl bg-hub-bg border border-hub-border text-xs text-hub-text-secondary space-y-2 font-mono">
          <div className="text-white font-bold mb-1">Example Scenario:</div>
          <p>1. You invite <span className="text-hub-gold">Alice</span>.</p>
          <p>2. Alice subscribes to <span className="text-emerald-400">Basic Tier</span> &rarr; You earn <span className="text-emerald-400 font-bold">KES 50</span> (Level 1).</p>
          <p>3. Alice invites <span className="text-cyan-400">Brian</span>.</p>
          <p>4. Brian subscribes to <span className="text-hub-gold">VIP Tier</span> &rarr; Alice earns <span className="text-emerald-400 font-bold">KES 150</span> (Level 1) AND You earn <span className="text-cyan-400 font-bold">KES 35</span> (Level 2)!</p>
        </div>
      </div>

      {/* Reward Matrix Table */}
      <div className="p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
        <h2 className="text-xl font-bold text-white">Complete Reward Matrix</h2>
        <p className="text-xs text-hub-text-secondary">
          Rewards are based on the membership plan selected by the paying subscriber:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hub-border text-hub-text-muted font-mono uppercase bg-hub-surface-elevated/50">
              <tr>
                <th className="py-3 px-4">Purchased Tier</th>
                <th className="py-3 px-4">Subscriber Pays</th>
                <th className="py-3 px-4 text-emerald-400">Level 1 (Direct Referrer)</th>
                <th className="py-3 px-4 text-cyan-400">Level 2 (Network Referrer)</th>
                <th className="py-3 px-4 text-white">Total Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border">
              <tr className="hover:bg-hub-surface-elevated/30">
                <td className="py-3 px-4 font-bold text-white">Starter Tier</td>
                <td className="py-3 px-4 font-mono">KES 70</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">KES 20</td>
                <td className="py-3 px-4 font-mono font-bold text-cyan-400">KES 5</td>
                <td className="py-3 px-4 font-mono text-white">KES 25 (35.7%)</td>
              </tr>
              <tr className="hover:bg-hub-surface-elevated/30">
                <td className="py-3 px-4 font-bold text-white">Basic Tier</td>
                <td className="py-3 px-4 font-mono">KES 150</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">KES 50</td>
                <td className="py-3 px-4 font-mono font-bold text-cyan-400">KES 15</td>
                <td className="py-3 px-4 font-mono text-white">KES 65 (43.3%)</td>
              </tr>
              <tr className="hover:bg-hub-surface-elevated/30">
                <td className="py-3 px-4 font-bold text-white">Pro Tier</td>
                <td className="py-3 px-4 font-mono">KES 250</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">KES 100</td>
                <td className="py-3 px-4 font-mono font-bold text-cyan-400">KES 25</td>
                <td className="py-3 px-4 font-mono text-white">KES 125 (50.0%)</td>
              </tr>
              <tr className="hover:bg-hub-surface-elevated/30">
                <td className="py-3 px-4 font-bold text-hub-gold">VIP Tier</td>
                <td className="py-3 px-4 font-mono">KES 350</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">KES 150</td>
                <td className="py-3 px-4 font-mono font-bold text-cyan-400">KES 35</td>
                <td className="py-3 px-4 font-mono text-white">KES 185 (52.8%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Terms & Integrity Policy */}
      <div className="p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Program Integrity & Anti-Fraud Rules
        </h2>

        <div className="space-y-3 text-xs text-hub-text-secondary leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Strict 2-Level Limit:</strong> The compensation structure is strictly capped at 2 degrees (Direct Referrer and Immediate Parent). There are zero commissions beyond Level 2, ensuring legal compliance and financial stability.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Qualifying Event Requirement:</strong> Referral earnings are strictly triggered upon verified, completed payment for a membership plan. Free registrations, mock payments, and refunded transactions generate zero commission.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">No Self-Referrals & Financial Loopholes:</strong> Users cannot refer themselves or alternate accounts. Attributions are automatically invalidated if the subscriber and referrer share an M-Pesa phone number, past transaction details, or device fingerprinting hashes.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Wallet & Withdrawals:</strong> Approved commissions are credited to your CodeVanta Wallet immediately. Users can request M-Pesa withdrawals from their dashboard once their approved balance reaches the minimum threshold of KES 50.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-hub-border flex items-center justify-between">
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 text-xs text-hub-gold hover:underline font-mono"
          >
            <span>View Membership Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover"
          >
            Go to Referral Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


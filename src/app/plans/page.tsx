"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MembershipPlan, PlanSlug } from "@/types";
import CheckoutModal from "@/components/CheckoutModal";
import PromoCodeRedeemBox from "@/components/PromoCodeRedeemBox";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Loader2,
  Check,
  CreditCard,
  Lock,
} from "lucide-react";

const PLAN_RANK: Record<PlanSlug, number> = {
  starter: 1,
  basic: 2,
  pro: 3,
  vip: 4,
  vvip: 5,
};

function PlansContent() {
  const searchParams = useSearchParams();
  const initialSelect = searchParams.get("select");

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<PlanSlug | "free">("free");

  useEffect(() => {
    Promise.all([fetch("/api/plans"), fetch("/api/auth/me")])
      .then(async ([plansRes, authRes]) => {
        const [plansData, authData] = await Promise.all([plansRes.json(), authRes.json()]);
        const availablePlans = (plansData.plans || []) as MembershipPlan[];
        const memberPlan = authData.authenticated ? authData.entitlements?.planSlug : "free";

        setPlans(availablePlans);
        setCurrentPlanSlug(memberPlan || "free");

        const memberRank = memberPlan === "free" ? 0 : PLAN_RANK[memberPlan as PlanSlug];
        const selectedPlanIsUpgrade = initialSelect
          ? PLAN_RANK[initialSelect as PlanSlug] > memberRank
          : false;
        if (
          initialSelect &&
          selectedPlanIsUpgrade &&
          availablePlans.some((plan) => plan.slug === initialSelect)
        ) {
          const match = availablePlans.find((plan) => plan.slug === initialSelect);
          if (match) setSelectedPlan(match);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialSelect]);

  const visiblePlans = plans;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-xs font-mono text-amber-300 uppercase tracking-wider font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>One-Time Investment • Lifetime Access</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Invest In Your <span className="shimmer-gold">Developer Toolkit</span>
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary leading-relaxed">
          Accessible, value-first membership tiers for Kenyan and international engineers. Unlock complete architectural blueprints,
          curated roadmaps, sideload short codes, and maximum 2-Tier referral earnings.
        </p>
      </div>

      {/* Active Member Status Badge if logged in */}
      {currentPlanSlug !== "free" && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-white/[0.03] border border-hub-gold/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-white">Active Plan: <strong className="text-hub-gold uppercase font-mono">{currentPlanSlug}</strong></span>
          </div>
          <span className="text-[11px] text-hub-text-muted">Select any tier below to test live checkout</span>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-20 text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading membership plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {visiblePlans.map((plan) => {
            const isVvip = plan.slug === "vvip";
            const isVip = plan.slug === "vip";
            const isPro = plan.slug === "pro";
            const isStarter = plan.slug === "starter";
            const isBasic = plan.slug === "basic";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl transition-all duration-300 glass-card-interactive card-specular-edge ${
                  isVvip
                    ? "border-fuchsia-400/80 shadow-[0_0_35px_-5px_rgba(217,70,239,0.35)] bg-gradient-to-b from-fuchsia-950/30 via-hub-surface to-hub-surface"
                    : isVip
                    ? "border-amber-400/80 shadow-[0_0_35px_-5px_rgba(229,193,88,0.3)] bg-gradient-to-b from-amber-950/30 via-hub-surface to-hub-surface"
                    : isPro
                    ? "border-emerald-500/50 hover:border-emerald-400/80"
                    : isStarter
                    ? "border-cyan-500/50 hover:border-cyan-400/80"
                    : "border-white/[0.1] hover:border-white/30"
                }`}
              >
                {/* Highlight Badge */}
                {isVvip && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-black text-[11px] font-black tracking-widest uppercase font-mono shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                    ⚡ Live Test • 2 Bob
                  </div>
                )}
                {isVip && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black text-[11px] font-black tracking-widest uppercase font-mono shadow-gold-glow">
                    Most Popular • Turnkey
                  </div>
                )}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold tracking-wider uppercase font-mono">
                    Full Blueprints
                  </div>
                )}
                {isStarter && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/50 text-[10px] font-bold tracking-wider uppercase font-mono">
                    Entry Gateway
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-hub-text-secondary mt-1 min-h-[36px] leading-relaxed">{plan.description}</p>

                  {/* Price Box */}
                  <div className="my-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-black font-mono ${isVvip ? "text-fuchsia-400" : isVip ? "text-amber-300" : isPro ? "text-emerald-400" : isStarter ? "text-cyan-400" : "text-white"}`}>
                        KES {plan.price_kes}
                      </span>
                      <span className="text-[11px] text-hub-text-muted uppercase font-mono tracking-wider">/ lifetime</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-hub-text-secondary">Level 1 (Direct reward):</span>
                        <span className="font-mono text-emerald-400 font-bold">KES {plan.direct_referral_reward_kes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-hub-text-secondary">Level 2 (Network bonus):</span>
                        <span className="font-mono text-cyan-400 font-bold">KES {plan.indirect_referral_reward_kes || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Entitlements List */}
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-hub-gold font-bold mb-3.5">
                    Included Benefits
                  </h4>

                  <ul className="space-y-3 text-xs text-hub-text-secondary mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Verified developer directory (55+ APIs)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_use_advanced_search ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_use_advanced_search ? "text-white" : "text-hub-text-muted"}>
                        Advanced multi-category filtering
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_access_learning_paths ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_access_learning_paths ? "text-white" : "text-hub-text-muted"}>
                        Beginner &amp; intermediate tutorials
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_access_original_blueprints ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_access_original_blueprints ? "text-white font-semibold" : "text-hub-text-muted"}>
                        OpenClaw AI &amp; architecture blueprints
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_download_starter_kits ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_download_starter_kits ? "text-amber-300 font-bold" : "text-hub-text-muted"}>
                        Downloadable production starter kits
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Android TV Downloader short codes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Save up to {plan.entitlements.max_bookmarks} personal bookmarks</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md ${
                    isVvip
                      ? "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 hover:brightness-110 text-black shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                      : isVip
                      ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-gold-glow"
                      : isPro
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : isStarter
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                >
                  <span>{isVvip ? "Test M-Pesa (2 Bob)" : `Select ${plan.name}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Promo Code Box */}
      <PromoCodeRedeemBox className="my-6" />

          {/* Interactive Feature Comparison Table */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Full Plan Comparison</h2>
              <p className="text-xs text-hub-text-secondary mt-1">Detailed feature entitlement matrix across all membership tiers.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-hub-text-muted font-mono uppercase">
              <tr>
                <th className="py-3 px-4">Capability / Entitlement</th>
                <th className="py-3 px-4 text-fuchsia-400 font-bold">VVIP (KES 2)</th>
                <th className="py-3 px-4 text-cyan-400">Starter (KES 70)</th>
                <th className="py-3 px-4 text-white">Basic (KES 150)</th>
                <th className="py-3 px-4 text-emerald-400">Pro (KES 250)</th>
                <th className="py-3 px-4 text-amber-300 font-bold">VIP (KES 350)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Public Developer Directory Access</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">Full Access</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">Full Access</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">Full Access</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">Full Access</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">Full Access</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">AFTVnews Downloader Short Codes</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">All Codes</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">All Codes</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">All Codes</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">All Codes</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">All Codes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Level 1 Referral Reward</td>
                <td className="py-3 px-4 font-mono text-fuchsia-400 font-bold">KES 1</td>
                <td className="py-3 px-4 font-mono text-emerald-400 font-bold">KES 20</td>
                <td className="py-3 px-4 font-mono text-emerald-400 font-bold">KES 50</td>
                <td className="py-3 px-4 font-mono text-emerald-400 font-bold">KES 100</td>
                <td className="py-3 px-4 font-mono text-amber-300 font-bold">KES 150</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Level 2 Network Bonus</td>
                <td className="py-3 px-4 font-mono text-fuchsia-400 font-bold">KES 0</td>
                <td className="py-3 px-4 font-mono text-cyan-400 font-bold">KES 5</td>
                <td className="py-3 px-4 font-mono text-cyan-400 font-bold">KES 15</td>
                <td className="py-3 px-4 font-mono text-cyan-400 font-bold">KES 25</td>
                <td className="py-3 px-4 font-mono text-amber-300 font-bold">KES 35</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Personal Bookmarks Limit</td>
                <td className="py-3 px-4 font-mono font-bold text-fuchsia-400">999 items</td>
                <td className="py-3 px-4 font-mono">15 items</td>
                <td className="py-3 px-4 font-mono">10 items</td>
                <td className="py-3 px-4 font-mono">50 items</td>
                <td className="py-3 px-4 font-mono font-bold text-amber-300">250+ items</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Advanced Blueprints &amp; OpenClaw AI</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">Full Access</td>
                <td className="py-3 px-4 text-hub-text-muted">—</td>
                <td className="py-3 px-4 text-hub-text-muted">—</td>
                <td className="py-3 px-4 text-emerald-400 font-mono">Full Access</td>
                <td className="py-3 px-4 text-emerald-400 font-mono font-bold">Full Access</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Turnkey Downloadable Starter Kits</td>
                <td className="py-3 px-4 text-fuchsia-400 font-mono font-bold">Instant ZIP Downloads</td>
                <td className="py-3 px-4 text-hub-text-muted">—</td>
                <td className="py-3 px-4 text-hub-text-muted">—</td>
                <td className="py-3 px-4 text-hub-text-muted">—</td>
                <td className="py-3 px-4 text-amber-300 font-mono font-bold">Instant ZIP Downloads</td>
              </tr>
            </tbody>
              </table>
            </div>
          </div>

      {/* Transparency Guarantee Box */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CodeVanta Platform Governance Principles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-hub-text-secondary leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">1. Genuine Independent Value</h4>
            <p>
              Every plan delivers real, immediate developer tools and knowledge assets. Memberships are completely self-contained—you never need to refer anyone to access the complete curriculum, directory, or downloadable kits.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">2. Instant M-Pesa &amp; Paystack Reconciliation</h4>
            <p>
              Payments are processed instantly using Safaricom M-Pesa and Paystack. No recurring monthly subscriptions or sneaky auto-billing—all plans are strictly one-time lifetime investments.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            setSelectedPlan(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading pricing...</span>
        </div>
      }
    >
      <PlansContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MembershipPlan } from "@/types";
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
} from "lucide-react";

function PlansContent() {
  const searchParams = useSearchParams();
  const initialSelect = searchParams.get("select");

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data.plans || []);
        if (initialSelect && data.plans) {
          const match = data.plans.find((p: MembershipPlan) => p.slug === initialSelect);
          if (match) setSelectedPlan(match);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialSelect]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-surface border border-hub-gold/30 text-xs font-mono text-hub-gold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TRANSPARENT VALUE-FIRST MEMBERSHIPS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Invest In Your Developer Toolkit
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary leading-relaxed">
          Affordable, accessible plans for Kenyan and international developers. Unlock architectural blueprints,
          curated learning roadmaps, and extended bookmarks.
        </p>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-20 text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading membership plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isVip = plan.slug === "vip";
            const isPro = plan.slug === "pro";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-hub-surface-card border transition-all ${
                  isVip
                    ? "border-hub-gold shadow-gold-glow"
                    : isPro
                    ? "border-emerald-600/60"
                    : "border-hub-border"
                }`}
              >
                {isVip && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-hub-gold text-hub-forest-dark text-[11px] font-extrabold tracking-wider uppercase font-mono shadow-md">
                    Recommended
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-hub-text-secondary mt-1 min-h-[36px]">{plan.description}</p>

                  <div className="my-6 p-4 rounded-xl bg-hub-surface border border-hub-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">KES {plan.price_kes}</span>
                      <span className="text-xs text-hub-text-muted uppercase font-mono">one-time access</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-hub-border text-xs flex items-center justify-between">
                      <span className="text-hub-text-secondary">Direct referral reward:</span>
                      <span className="font-mono text-emerald-400 font-bold">KES {plan.direct_referral_reward_kes}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold mb-3">
                    Plan Entitlements
                  </h4>

                  <ul className="space-y-3 text-xs text-hub-text-secondary mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Public verified developer directory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_use_advanced_search ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_use_advanced_search ? "text-hub-text-primary" : "text-hub-text-muted"}>
                        Advanced multi-category filtering
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_access_learning_paths ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_access_learning_paths ? "text-hub-text-primary" : "text-hub-text-muted"}>
                        Selected beginner &amp; intermediate tutorials
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_access_original_blueprints ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_access_original_blueprints ? "text-hub-text-primary" : "text-hub-text-muted"}>
                        Full-stack blueprints &amp; payment guides
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_download_starter_kits ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_download_starter_kits ? "text-hub-text-primary font-bold text-hub-gold" : "text-hub-text-muted"}>
                        Downloadable production starter kits
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Personal referral dashboard</span>
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
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    isVip
                      ? "bg-hub-gold hover:bg-hub-gold-hover text-hub-forest-dark shadow-gold-glow"
                      : "bg-hub-surface hover:bg-hub-surface-elevated text-white border border-hub-border hover:border-hub-gold/50"
                  }`}
                >
                  <span>Select {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <PromoCodeRedeemBox className="my-6" />

      {/* Transparency Guarantee Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CodeVanta Platform Governance Principles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-hub-text-secondary leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">1. Independent Utility</h4>
            <p>
              Your membership delivers standalone value from day one. You do not need to recruit members, refer friends,
              or post links to access any guide, starter kit, or resource.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">2. Transparent Referral Compensation</h4>
            <p>
              Referral rewards are funded strictly from product profit margins. Real-money commission payouts remain
              gated under certified Kenyan legal compliance review.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading plans...</span>
        </div>
      }
    >
      <PlansContent />
    </Suspense>
  );
}

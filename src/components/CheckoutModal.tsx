"use client";

import React, { useState } from "react";
import { MembershipPlan } from "@/types";
import { X, Check, ShieldCheck, AlertCircle, Phone, ArrowRight, Loader2 } from "lucide-react";

interface CheckoutModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CheckoutModal({ plan, onClose, onSuccess }: CheckoutModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("0700000001");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "prompt" | "success" | "error">("details");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentId, setPaymentId] = useState("");

  if (!plan) return null;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Initiate checkout
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          phoneNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to initiate payment");
        setStep("error");
        setLoading(false);
        return;
      }

      setPaymentId(data.payment.id);
      setStep("prompt");

      // In development / sandbox mode, automatically simulate callback after 2.5 seconds
      setTimeout(async () => {
        try {
          const webhookRes = await fetch("/api/checkout/webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mpesa-signature": "sandbox_test_signature",
            },
            body: JSON.stringify({
              paymentId: data.payment.id,
              status: "completed",
              mpesaReceiptNumber: `SAMP${Date.now().toString().slice(-6)}`,
            }),
          });
          const webhookData = await webhookRes.json();
          if (webhookRes.ok && webhookData.success) {
            setStep("success");
            if (onSuccess) onSuccess();
          } else {
            setErrorMessage(webhookData.message || "Webhook processing failed");
            setStep("error");
          }
        } catch {
          setErrorMessage("Error verifying sandbox payment");
          setStep("error");
        } finally {
          setLoading(false);
        }
      }, 2500);
    } catch {
      setErrorMessage("Network error during payment initiation.");
      setStep("error");
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-hub-surface-elevated border border-hub-border p-6 sm:p-8 shadow-2xl text-hub-text-primary"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-hub-surface text-hub-text-muted hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "details" && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
                Membership Upgrade
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">{plan.name}</h3>

            <div className="mt-4 p-4 rounded-xl bg-hub-surface border border-hub-border flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-extrabold text-white">KES {plan.price_kes}</span>
                <span className="text-xs text-hub-text-muted ml-1.5 uppercase font-mono">one-time / lifetime</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-400 block">Referral Reward:</span>
                <span className="text-xs font-mono text-hub-text-secondary">KES {plan.direct_referral_reward_kes} to eligible referrer</span>
              </div>
            </div>

            <p className="text-xs text-hub-text-secondary mt-3 leading-relaxed">
              {plan.description}
            </p>

            {/* Anti-recruitment transparency note */}
            <div className="mt-4 p-3 rounded-lg bg-hub-bg border border-hub-border text-xs text-hub-text-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Recruitment Requirement:</strong> All developer tools, curated guides, and benefits in this
                plan are unlocked immediately for your personal development. You never need to recruit anyone.
              </span>
            </div>

            <form onSubmit={handleInitiate} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
                  M-Pesa Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07XX XXX XXX or 2547XXXXXXXX"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface border border-hub-border focus:border-hub-gold focus:outline-none text-sm text-white"
                  />
                </div>
                <span className="text-[11px] text-hub-text-muted block mt-1">
                  Connected to Sandbox M-Pesa STK Simulator for instant testing.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold bg-hub-gold hover:bg-hub-gold-hover text-hub-forest-dark transition-all flex items-center justify-center gap-2 shadow-gold-glow active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initiating Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay KES {plan.price_kes}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === "prompt" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-hub-gold/15 border border-hub-gold/30 mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-hub-gold animate-spin" />
            </div>

            <h3 className="text-xl font-bold text-white">Simulating STK Push Prompt</h3>
            <p className="text-sm text-hub-text-secondary max-w-sm mx-auto">
              Simulating prompt sent to <span className="text-white font-mono">{phoneNumber}</span> for KES {plan.price_kes}.
              Awaiting sandbox webhook confirmation...
            </p>

            <div className="p-3 rounded-lg bg-hub-surface text-xs text-hub-text-muted font-mono">
              Transaction ID: {paymentId}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white">Membership Activated!</h3>
            <p className="text-sm text-hub-text-secondary max-w-sm mx-auto">
              Your account has been upgraded to <strong className="text-hub-gold">{plan.name}</strong>.
              All entitled tools, blueprints, and extended bookmarks are now active.
            </p>

            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="mt-4 px-6 py-2.5 rounded-lg font-semibold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 mx-auto flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">Payment Incomplete</h3>
            <p className="text-sm text-red-400 max-w-sm mx-auto">{errorMessage}</p>

            <button
              onClick={() => setStep("details")}
              className="mt-4 px-6 py-2 rounded-lg text-sm bg-hub-surface border border-hub-border text-white hover:bg-hub-surface-elevated"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

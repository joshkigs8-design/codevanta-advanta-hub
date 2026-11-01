"use client";

import React, { useState } from "react";
import { MembershipPlan } from "@/types";
import {
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  Phone,
  ArrowRight,
  Loader2,
  CreditCard,
  Send,
  ExternalLink,
} from "lucide-react";

interface CheckoutModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CheckoutModal({ plan, onClose, onSuccess }: CheckoutModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("0700000001");
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa_stk">("paystack");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "prompt" | "success" | "error">("details");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [promptMessage, setPromptMessage] = useState("");

  if (!plan) return null;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (paymentMethod === "paystack") {
        // 1. Initiate Paystack checkout
        const res = await fetch("/api/checkout/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planSlug: plan.slug,
            phoneNumber,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || "Failed to initiate Paystack checkout");
          setStep("error");
          setLoading(false);
          return;
        }

        // If live Paystack authorization URL is returned, redirect to checkout
        if (data.mode === "live" && data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
          return;
        }

        // In sandbox / simulated mode, display simulation prompt and verify
        setPaymentId(data.payment.id);
        setPromptMessage(`Paystack checkout initiated for KES ${plan.price_kes}. Simulating successful charge...`);
        setStep("prompt");

        setTimeout(async () => {
          try {
            const webhookRes = await fetch("/api/checkout/paystack/webhook", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-paystack-signature": "sandbox_paystack_test_signature",
              },
              body: JSON.stringify({
                event: "charge.success",
                data: {
                  reference: data.reference,
                  amount: plan.price_kes * 100,
                  currency: "KES",
                  status: "success",
                  metadata: {
                    paymentId: data.payment.id,
                    planSlug: plan.slug,
                  },
                },
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
            setErrorMessage("Error verifying sandbox Paystack payment");
            setStep("error");
          } finally {
            setLoading(false);
          }
        }, 2500);
      } else {
        // M-Pesa STK Simulator flow
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
          setErrorMessage(data.error || "Failed to initiate M-Pesa payment");
          setStep("error");
          setLoading(false);
          return;
        }

        setPaymentId(data.payment.id);
        setPromptMessage(`STK prompt simulated to ${phoneNumber} for KES ${plan.price_kes}.`);
        setStep("prompt");

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
      }
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
                <span className="text-xs font-semibold text-emerald-400 block">Referral Rewards:</span>
                <span className="text-xs font-mono text-hub-text-secondary">
                  L1 KES {plan.direct_referral_reward_kes} • L2 KES {plan.indirect_referral_reward_kes}
                </span>
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
                plan are unlocked immediately for your personal development.
              </span>
            </div>

            <form onSubmit={handleInitiate} className="mt-6 space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paystack")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === "paystack"
                        ? "border-hub-gold bg-hub-gold/10 text-white"
                        : "border-hub-border bg-hub-surface text-hub-text-muted hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CreditCard className="w-4 h-4 text-hub-gold" />
                      {paymentMethod === "paystack" && <Check className="w-3.5 h-3.5 text-hub-gold" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white">Paystack</div>
                      <div className="text-[11px] text-hub-text-muted">M-Pesa, Card & Bank</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa_stk")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === "mpesa_stk"
                        ? "border-hub-gold bg-hub-gold/10 text-white"
                        : "border-hub-border bg-hub-surface text-hub-text-muted hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      {paymentMethod === "mpesa_stk" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white">M-Pesa STK</div>
                      <div className="text-[11px] text-hub-text-muted">Instant Push Simulator</div>
                    </div>
                  </button>
                </div>
              </div>

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
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-hub-surface border border-hub-border focus:border-hub-gold focus:outline-none text-sm text-white font-mono"
                  />
                </div>
                <span className="text-[11px] text-hub-text-muted block mt-1">
                  Used for account verification and referral commission disbursements.
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
                    <span>Processing Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed with {paymentMethod === "paystack" ? "Paystack" : "M-Pesa"} (KES {plan.price_kes})</span>
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

            <h3 className="text-xl font-bold text-white">Processing Payment</h3>
            <p className="text-sm text-hub-text-secondary max-w-sm mx-auto">
              {promptMessage}
            </p>

            <div className="p-3 rounded-lg bg-hub-surface text-xs text-hub-text-muted font-mono">
              Ref: {paymentId}
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
              All entitled tools, blueprints, and referral privileges are now active.
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MembershipPlan, PlanSlug } from "@/types";
import {
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  Phone,
  ArrowRight,
  Loader2,
  Lock,
  RefreshCw,
  LogIn,
  UserCheck,
  Download,
  Printer,
  Sparkles,
} from "lucide-react";
import { ReceiptPrinter, type ReceiptPrinterStage } from "./ReceiptPrinter";
import { downloadReceiptPdf } from "@/lib/pdfReceipt";

interface CheckoutModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
}

const AVAILABLE_PLANS: Array<{ slug: PlanSlug; name: string; priceKes: number; tag: string }> = [
  { slug: "vvip", name: "VVIP (2 Bob)", priceKes: 2, tag: "KES 2" },
  { slug: "starter", name: "Starter", priceKes: 70, tag: "KES 70" },
  { slug: "basic", name: "Basic", priceKes: 150, tag: "KES 150" },
  { slug: "pro", name: "Pro", priceKes: 250, tag: "KES 250" },
  { slug: "vip", name: "VIP", priceKes: 350, tag: "KES 350" },
];

export default function CheckoutModal({ plan: initialPlan, onClose, onSuccess }: CheckoutModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(initialPlan);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "prompt" | "success" | "failed">("details");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthError, setIsAuthError] = useState(false);
  const [activeReference, setActiveReference] = useState("");
  const [promptMessage, setPromptMessage] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [printerStage, setPrinterStage] = useState<ReceiptPrinterStage>("printing");
  const [printerAnimKey, setPrinterAnimKey] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step === "success") {
      setPrinterStage("printing");
      setPrinterAnimKey((k) => k + 1);
      const timer = setTimeout(() => {
        setPrinterStage("complete");
      }, 2300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleReplayPrint = () => {
    setPrinterStage("printing");
    setPrinterAnimKey((k) => k + 1);
    setTimeout(() => {
      setPrinterStage("complete");
    }, 2300);
  };

  const handleDownloadPdf = () => {
    if (!selectedPlan) return;
    downloadReceiptPdf({
      reference: receiptNumber || activeReference || `PSTK-${Date.now()}`,
      planName: selectedPlan.name,
      planSlug: selectedPlan.slug,
      amountKes: selectedPlan.price_kes,
      customerName: currentUser?.full_name || "CodeVanta Member",
      customerEmail: currentUser?.email,
      phoneNumber: phoneNumber || cleanPhone,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  // Clean up polling interval when component unmounts or step changes
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Check user authentication status on mount
  useEffect(() => {
    let isMounted = true;
    setAuthChecking(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) setCurrentUser(null);
      })
      .finally(() => {
        if (isMounted) setAuthChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!selectedPlan) return null;

  // Validate Kenyan Safaricom phone number format
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, "");
  const isPhoneValid =
    /^(07|01)\d{8}$/.test(cleanPhone) ||
    /^(2547|2541)\d{8}$/.test(cleanPhone) ||
    /^(\+2547|\+2541)\d{8}$/.test(cleanPhone);

  const handlePlanSelect = (slug: PlanSlug) => {
    if (selectedPlan.slug === slug) return;
    const match = AVAILABLE_PLANS.find((p) => p.slug === slug);
    if (match) {
      setSelectedPlan({
        ...selectedPlan,
        slug: match.slug,
        name: match.name,
        price_kes: match.priceKes,
      });
    }
  };

  /**
   * 1. Initiate Paystack POST /charge with currency: KES & mobile_money.provider: mpesa
   */
  const handleInitiateMpesaCharge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setIsAuthError(true);
      setErrorMessage("You must be logged in before checking out. Please sign in or create an account.");
      setStep("failed");
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage("Please enter a valid Kenyan Safaricom phone number (e.g. 0712 345 678 or 0110 123 456).");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setIsAuthError(false);

    try {
      const res = await fetch("/api/checkout/paystack/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: selectedPlan.slug,
          phoneNumber: cleanPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setIsAuthError(true);
        }
        setErrorMessage(data.error || "Failed to initiate M-Pesa authorization prompt.");
        setStep("failed");
        setLoading(false);
        return;
      }

      // Successful initiation: STK Prompt has been dispatched to customer's phone!
      setActiveReference(data.reference);
      setPromptMessage(
        data.displayText ||
          `An M-Pesa prompt has been dispatched to ${data.phoneNumber || cleanPhone}. Please check your phone screen and enter your PIN.`
      );
      setStep("prompt");
      setLoading(false);
      setPollCount(0);

      // 2. Start polling the backend verification endpoint
      startVerificationPolling(data.reference);
    } catch {
      setErrorMessage("Network connection error while contacting Paystack. Please check your internet and try again.");
      setStep("failed");
      setLoading(false);
    }
  };

  /**
   * 2. Transaction verification polling
   * Polls every 2.5s for up to 90 seconds. Does NOT activate memberships client-side;
   * membership activation is executed exclusively server-side upon verified Paystack confirmation.
   */
  const startVerificationPolling = (reference: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 36; // 36 * 2.5s = 90 seconds timeout

    pollIntervalRef.current = setInterval(async () => {
      attempts += 1;
      setPollCount(attempts);

      if (attempts > maxAttempts) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setErrorMessage(
          "Payment verification timed out. If you entered your M-Pesa PIN, your membership will activate automatically once Safaricom completes processing."
        );
        setStep("failed");
        return;
      }

      try {
        const verifyRes = await fetch(`/api/checkout/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const verifyData = await verifyRes.json();

        if (verifyData.status === "success") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setReceiptNumber(verifyData.reference || reference);
          setStep("success");
          if (onSuccess) onSuccess();
        } else if (verifyData.status === "failed") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setErrorMessage(verifyData.message || "M-Pesa authorization prompt was cancelled, declined, or timed out.");
          setStep("failed");
        }
      } catch (err) {
        console.warn("Transient verification check error, will retry:", err);
      }
    }, 2500);
  };

  /**
   * Manual instant check trigger
   */
  const handleManualCheck = async () => {
    if (!activeReference) return;
    setLoading(true);
    try {
      const verifyRes = await fetch(`/api/checkout/paystack/verify?reference=${encodeURIComponent(activeReference)}`);
      const verifyData = await verifyRes.json();

      if (verifyData.status === "success") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setReceiptNumber(verifyData.reference || activeReference);
        setStep("success");
        if (onSuccess) onSuccess();
      } else if (verifyData.status === "failed") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setErrorMessage(verifyData.message || "Payment was declined or cancelled on your phone.");
        setStep("failed");
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const loginRedirectUrl = `/login?next=${encodeURIComponent(`/plans?select=${selectedPlan.slug}`)}`;
  const registerRedirectUrl = `/register?next=${encodeURIComponent(`/plans?select=${selectedPlan.slug}`)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-[#0e121b]/98 backdrop-blur-2xl card-specular-edge border border-white/[0.14] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.04] text-hub-text-muted hover:text-white border border-white/[0.08] transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* STEP 1: PLAN CONFIRMATION & M-PESA PHONE ENTRY                           */}
        {/* ========================================================================= */}
        {step === "details" && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] uppercase tracking-wider font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Paystack M-Pesa Checkout</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Upgrade to CodeVanta {selectedPlan.name}
              </h3>
              <p className="text-xs text-hub-text-secondary mt-1">
                Enter your Safaricom phone number to receive an instant M-Pesa STK PIN authorization prompt.
              </p>
            </div>

            {/* Plan Selector Strip */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-hub-text-muted mb-2 font-bold">
                Select Membership Tier:
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {AVAILABLE_PLANS.map((p) => {
                  const isSelected = selectedPlan.slug === p.slug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => handlePlanSelect(p.slug)}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-hub-gold/20 border-hub-gold text-hub-gold font-bold shadow-gold-glow"
                          : "bg-white/[0.02] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="text-xs font-extrabold">{p.name}</div>
                      <div className="text-[10px] font-mono text-hub-text-muted mt-0.5">{p.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-hub-text-muted block">
                  Total Due (One-Time)
                </span>
                <span className="text-3xl font-black text-white font-mono tracking-tight mt-0.5 block">
                  KES {selectedPlan.price_kes}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold block">
                  Lifetime Access
                </span>
                <span className="text-[10px] text-hub-text-muted mt-1 block">Zero recurring monthly fees</span>
              </div>
            </div>

            {/* Authentication Gate / Linked Account Badge */}
            {authChecking ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-hub-text-muted flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-hub-gold" />
                <span>Checking account status...</span>
              </div>
            ) : !currentUser ? (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-left space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-hub-gold" />
                  <span>Account Required for Lifetime Activation</span>
                </div>
                <p className="text-xs text-hub-text-secondary leading-relaxed">
                  Please sign in or create a free CodeVanta account first so your membership, entitlements, and referral wallet are linked to your profile.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={loginRedirectUrl}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold text-center border border-white/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href={registerRedirectUrl}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-black text-center transition-all shadow-gold-glow flex items-center justify-center gap-1"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-hub-gold/20 text-hub-gold flex items-center justify-center font-bold text-[10px] border border-hub-gold/40 shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-hub-gold" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-hub-text-muted block">Activating Entitlements For:</span>
                    <span className="font-semibold text-white truncate block">{currentUser.email}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold shrink-0">
                  Linked
                </span>
              </div>
            )}

            {/* Anti-Scam Security Notice */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-amber-300">Safe Checkout:</strong> We will <strong>NEVER</strong> ask for your M-Pesa PIN on this website. You will enter your PIN exclusively on your phone&apos;s official Safaricom pop-up prompt.
              </div>
            </div>

            {/* M-Pesa Phone Form */}
            <form onSubmit={handleInitiateMpesaCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1.5">
                  Safaricom M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07XX XXX XXX or 01XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-hub-base/80 border border-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 focus:outline-none text-sm text-white font-mono placeholder:text-white/30"
                  />
                </div>
                <span className="text-[11px] text-hub-text-secondary mt-1 block">
                  Accepts standard Kenyan formats (e.g. 0712 345 678, 0110 123 456, or +254 712 345 678).
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || authChecking || !currentUser}
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:brightness-110 text-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching M-Pesa Prompt...</span>
                  </>
                ) : (
                  <>
                    <span>Pay KES {selectedPlan.price_kes} via M-Pesa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PENDING M-PESA STK PROMPT AUTHORIZATION (WAITING FOR PIN ON PHONE) */}
        {/* ========================================================================= */}
        {step === "prompt" && (
          <div className="text-center py-4 sm:py-6 space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-black border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <Phone className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                Authorization Prompt Sent
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Check Your Phone Screen Now
              </h3>
              <p className="text-xs sm:text-sm text-hub-text-secondary max-w-sm mx-auto leading-relaxed">
                {promptMessage}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-2 text-left">
              <div className="flex items-center justify-between text-hub-text-muted font-mono text-[11px]">
                <span>Transaction Ref:</span>
                <span className="text-white font-bold">{activeReference}</span>
              </div>
              <div className="flex items-center justify-between text-hub-text-muted font-mono text-[11px]">
                <span>Amount:</span>
                <span className="text-emerald-400 font-bold">KES {selectedPlan.price_kes}</span>
              </div>
              <div className="flex items-center justify-between text-hub-text-muted font-mono text-[11px]">
                <span>Status:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Awaiting PIN confirmation...
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>I have entered my PIN / Check Status</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setStep("details");
                }}
                className="text-xs text-hub-text-muted hover:text-white transition-colors"
              >
                Change Phone Number or Plan
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: PAYMENT CONFIRMED & ANIMATED RECEIPT PRINTER                     */}
        {/* ========================================================================= */}
        {step === "success" && (
          <div className="py-2 space-y-4 max-h-[85vh] overflow-y-auto pr-1">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Payment Verified</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome to CodeVanta {selectedPlan.name}!
              </h3>
            </div>

            {/* Receipt Printer Machine & Feeding Paper */}
            <ReceiptPrinter.Root key={printerAnimKey} stage={printerStage} feedMotion="stepped">
              <ReceiptPrinter.Machine>
                <ReceiptPrinter.Header>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-hub-gold font-bold">
                    <Sparkles className="w-3 h-3 text-hub-gold" />
                    <span>CODEVANTA POS</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReplayPrint}
                    className="text-[10px] font-mono text-hub-text-muted hover:text-hub-gold transition-colors flex items-center gap-1 active:scale-95"
                    title="Replay printing animation"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Replay Feed</span>
                  </button>
                </ReceiptPrinter.Header>

                <ReceiptPrinter.Screen>
                  <ReceiptPrinter.Status />
                </ReceiptPrinter.Screen>
              </ReceiptPrinter.Machine>

              <ReceiptPrinter.Output>
                <ReceiptPrinter.Paper>
                  <div className="text-center pb-2 border-b border-dashed border-zinc-400 space-y-0.5">
                    <div className="font-bold text-xs uppercase tracking-wider text-black">CodeVanta Advanta Hub</div>
                    <div className="text-[9px] text-zinc-600">Nairobi, Kenya • Lifetime Access</div>
                    <div className="text-[8px] text-zinc-500 font-mono">support@codevanta.online</div>
                  </div>

                  <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-[9.5px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">REF:</span>
                      <span className="font-bold text-black">{receiptNumber || activeReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">DATE:</span>
                      <span className="text-zinc-800">{new Date().toLocaleDateString("en-GB")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">CLIENT:</span>
                      <span className="font-semibold text-zinc-800 truncate max-w-[130px]">{currentUser?.email || "Member"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">PHONE:</span>
                      <span className="font-mono text-zinc-800">{phoneNumber || cleanPhone}</span>
                    </div>
                  </div>

                  <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-[9.5px]">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>PLAN</span>
                      <span>PRICE</span>
                    </div>
                    <div className="flex justify-between text-zinc-900">
                      <span className="truncate max-w-[140px]">{selectedPlan.name} (Lifetime)</span>
                      <span className="font-bold shrink-0">KES {selectedPlan.price_kes}.00</span>
                    </div>
                    <div className="flex justify-between text-zinc-500 text-[8.5px]">
                      <span>Platform Fee (0%)</span>
                      <span>KES 0.00</span>
                    </div>
                  </div>

                  <div className="pt-2 text-[10.5px] flex justify-between font-black text-black">
                    <span>TOTAL:</span>
                    <span>KES {selectedPlan.price_kes}.00</span>
                  </div>

                  <div className="mt-2.5 py-1 px-2 rounded bg-emerald-100 border border-emerald-300 text-center text-emerald-800 text-[8.5px] font-bold uppercase tracking-wider">
                    ✓ M-PESA CONFIRMED &amp; ACTIVE
                  </div>
                </ReceiptPrinter.Paper>
              </ReceiptPrinter.Output>
            </ReceiptPrinter.Root>

            {/* Action Buttons: Download PDF & Continue */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-hub-gold" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Print Slip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = "/dashboard?payment=success";
                }}
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-hub-gold via-amber-400 to-hub-gold text-hub-forest-dark hover:brightness-110 transition-all shadow-gold-glow active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Continue to Member Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PAYMENT FAILED OR CANCELLED                                      */}
        {/* ========================================================================= */}
        {step === "failed" && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 to-black border-2 border-red-500/50 mx-auto flex items-center justify-center text-red-400 shadow-xl shadow-red-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold block">
                {isAuthError ? "Authentication Required" : "Authorization Incomplete"}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAuthError ? "Sign In to Complete Upgrade" : "M-Pesa Payment Not Completed"}
              </h3>
              <p className="text-xs sm:text-sm text-red-300/90 max-w-sm mx-auto leading-relaxed">
                {errorMessage || "The M-Pesa prompt was cancelled or timed out before PIN authorization."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              {isAuthError ? (
                <div className="space-y-2">
                  <Link
                    href={loginRedirectUrl}
                    className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-gold-glow"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Your Account</span>
                  </Link>
                  <Link
                    href={registerRedirectUrl}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-md"
                >
                  Try Again with M-Pesa
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-hub-text-muted hover:text-white transition-colors py-1"
              >
                Cancel and Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

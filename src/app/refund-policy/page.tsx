import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-hub-gold hover:underline font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="space-y-2 border-b border-hub-border pb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-hub-gold font-bold">
          Consumer Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="text-xs text-hub-text-muted font-mono">Fair, auditable customer terms</p>
      </div>

      <div className="prose prose-invert max-w-none text-sm text-hub-text-secondary space-y-6 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. General Refund Philosophy</h2>
          <p>
            At CodeVanta Ventures, we stand behind the value of CodeVanta Advanta Hub. Because our membership unlocks
            instant digital assets, downloadable starter blueprints, and curated knowledge bases, refunds are processed
            under fair, transparent criteria.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Eligible Refund Circumstances</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Duplicate or Unintended Charges:</strong> If network latency or a payment gateway anomaly causes
              you to be charged more than once for the same membership, duplicate transactions will be refunded in full.
            </li>
            <li>
              <strong>Technical Non-Delivery:</strong> If a technical fault prevents your account from accessing entitled
              guides or blueprints and our engineering team cannot resolve it within 72 hours of report, you are entitled to a full refund.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Impact on Referral Rewards (Clawback Policy)</h2>
          <p>
            To prevent fraud and intentional abuse, if a membership payment is refunded, reversed, or disputed:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Any pending or unwithdrawn referral commission tied to the refunded transaction is immediately cancelled.</li>
            <li>If a commission was already disbursed, it will be deducted from the referrer&apos;s future reward balance.</li>
            <li>All clawbacks are permanently recorded in the append-only ledger for full auditability.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. How to Request a Refund</h2>
          <p>
            Email your payment reference (M-Pesa transaction code), registered email, and reason for request to{" "}
            <span className="text-hub-gold font-mono">support@codevanta.online</span>. We review and respond within 2 business days.
          </p>
        </section>
      </div>
    </div>
  );
}

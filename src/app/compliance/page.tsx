import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default function CompliancePage() {
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
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
          <Scale className="w-4 h-4" />
          <span>Kenyan Legal Governance &amp; Anti-Pyramid Disclosure</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Referral Programme Compliance Architecture
        </h1>
        <p className="text-sm text-hub-text-secondary">
          Platform governance principles operated by CodeVanta Ventures under Kenyan law.
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-sm text-hub-text-secondary space-y-8 leading-relaxed">
        {/* Callout box */}
        <div className="p-5 rounded-2xl bg-hub-surface border border-emerald-500/40 text-hub-text-primary space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <ShieldCheck className="w-5 h-5" />
            <span>Why CodeVanta Advanta Hub Is NOT a Pyramid Scheme</span>
          </div>
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            Under Section 41 of the Kenyan Consumer Protection Act (2012) and international consumer protection standards,
            pyramid schemes generate revenues primarily by recruiting participants rather than selling bona fide goods or services.
            CodeVanta Advanta Hub is architected fundamentally differently:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border space-y-1">
              <span className="font-bold text-white block">1. Substantive Independent Product</span>
              <p className="text-hub-text-muted">
                Every member purchases access to high-value developer assets: tested free API catalogs,
                cloud rate-limit trackers, production starter kits, and learning guides.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border space-y-1">
              <span className="font-bold text-white block">2. Zero Recruitment Mandate</span>
              <p className="text-hub-text-muted">
                Members are never forced, required, or incentivized to invite others in order to access their purchased tools or starter blueprints.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border space-y-1">
              <span className="font-bold text-white block">3. Direct Referrals Only (No Downlines)</span>
              <p className="text-hub-text-muted">
                We strictly disallow multi-level commissions (MLM), pyramid levels, matrix tiers, or passive recruiter earnings from downlines.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-hub-surface-elevated border border-hub-border space-y-1">
              <span className="font-bold text-white block">4. Economically Sustainable</span>
              <p className="text-hub-text-muted">
                Referral rewards are funded strictly from direct product gross margins, never from an unsustainable cycle of new participant signups.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Gate Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>The Legal Compliance Gate Workflow</span>
          </h2>
          <p>
            Before real-money commissions can be paid out, our platform implements a tamper-proof administrative gate:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs">
            <li>
              <strong>Default State: Compliance Review:</strong> All referral rewards accrue in audited balances,
              but live M-Pesa disbursement buttons remain hard-locked.
            </li>
            <li>
              <strong>Qualified Advocate Review:</strong> A certified Kenyan advocate must review the compensation
              schedule, tax withholdings, and terms of service.
            </li>
            <li>
              <strong>Cryptographic Audit Sign-Off:</strong> Only after recording the advocate&apos;s name and High Court roll number in the system settings can the administrative console unlock live disbursements.
            </li>
          </ol>
        </section>

        {/* Anti-Fraud Rules */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Strict Anti-Fraud &amp; Integrity Controls</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>No Self-Referrals:</strong> The database schema strictly prohibits referring one&apos;s own account or matching credit references.</li>
            <li><strong>Idempotent Rewards:</strong> Each membership purchase can generate at most one referral transaction. Duplicate webhooks cannot create duplicate payable rewards.</li>
            <li><strong>Clawback on Refund:</strong> If a referred membership is refunded or disputed, the associated referral reward is reversed from the wallet ledger automatically.</li>
            <li><strong>Append-Only Ledger:</strong> Every wallet balance change is backed by an auditable immutable ledger entry.</li>
          </ul>
        </section>

        {/* Contact */}
        <div className="p-4 rounded-xl bg-hub-surface border border-hub-border text-xs text-hub-text-secondary flex items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white block">Legal &amp; Compliance Inquiries</span>
            <span>For questions regarding our terms, write to: legal@codevanta.com</span>
          </div>
          <Link
            href="/plans"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shrink-0"
          >
            View Membership Plans
          </Link>
        </div>
      </div>
    </div>
  );
}

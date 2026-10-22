import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          CodeVanta Ventures Governance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-hub-text-muted font-mono">Effective Date: October 2026</p>
      </div>

      <div className="prose prose-invert max-w-none text-sm text-hub-text-secondary space-y-6 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Operator &amp; Platform Identification</h2>
          <p>
            <strong>CodeVanta Advanta Hub</strong> is owned, maintained, and operated by <strong>CodeVanta Ventures</strong>,
            a technology initiative established in Nairobi, Kenya. By accessing or using the platform, you agree to be bound
            by these Terms of Service and all applicable laws and regulations of the Republic of Kenya.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Nature of the Service &amp; Independent Value</h2>
          <p>
            CodeVanta Advanta Hub provides curated developer discovery tools, API documentation indexes, verified cloud
            free-tier data, architectural blueprints, and programming tutorials.
          </p>
          <div className="p-4 rounded-xl bg-hub-surface border border-hub-gold/30 text-xs text-hub-text-primary">
            <strong>Core Principle:</strong> Every membership plan delivers genuine, standalone utility. Members are
            never required or coerced to recruit, invite, or refer other users to enjoy the benefits of their purchased plan.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Third-Party Resources &amp; External Trademarks</h2>
          <p>
            The platform indexes publicly available developer tools, open-source repositories, and third-party SaaS services
            (such as Google Gemini, Supabase, Render, Safaricom Daraja, etc.). All product names, logos, and brands are property
            of their respective owners. Indexing does not imply endorsement by third-party providers. We disclaim liability
            for modifications to third-party pricing, terms, or quota adjustments made by external providers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Referral Programme Rules &amp; Anti-Fraud Governance</h2>
          <p>
            Participation in the referral programme is strictly optional. The referral system operates under strict direct-only
            attribution. Multi-level marketing (MLM), downline commissions, self-referrals, automated bot sign-ups, and
            misleading income claims are strictly prohibited and result in immediate account termination.
          </p>
          <p>
            Referral commissions are funded from direct product sales margins. In accordance with platform policy and Kenyan
            consumer protection guidelines, monetary referral withdrawals are subject to compliance reviews and may be
            paused or disabled without affecting resource directory access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms are governed by and construed in accordance with the Laws of the Republic of Kenya. Any disputes
            arising under these terms shall be resolved amicably through good-faith negotiation before escalating to the
            competent courts of Nairobi, Kenya.
          </p>
        </section>
      </div>
    </div>
  );
}

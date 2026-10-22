import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
          Data Protection Compliance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-hub-text-muted font-mono">
          Compliant with the Kenya Data Protection Act, 2019 (KDPA) &amp; International Standards
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-sm text-hub-text-secondary space-y-6 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Data Controller</h2>
          <p>
            CodeVanta Ventures (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates CodeVanta Advanta Hub and acts as the data
            controller responsible for your personal data collected through this platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account Data:</strong> Name, email address, password hash, and country of residence.</li>
            <li><strong>Transaction &amp; Payout Data:</strong> Payment provider references, disbursement mobile numbers (M-Pesa), and ledger timestamps. We do NOT collect or store payment PINs or credit card CVV codes.</li>
            <li><strong>Referral Attribution:</strong> Unique referral codes and hashed technical fingerprints (anonymized IP and User-Agent hashes) strictly for anti-fraud reconciliation.</li>
            <li><strong>Usage Telemetry:</strong> Bookmarked tools and directory click counts.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. How We Use Your Data</h2>
          <p>
            Your information is processed strictly to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Authenticate sessions and deliver membership entitlements.</li>
            <li>Record transparent, tamper-proof financial ledgers for referral rewards.</li>
            <li>Prevent duplicate payments, self-referrals, and malicious abuse.</li>
            <li>Comply with Kenyan financial, tax, and cybercrime regulatory mandates.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Data Subject Rights Under KDPA 2019</h2>
          <p>
            You have the right to request access to your personal data, rectify inaccuracies, request deletion of
            your account, and object to processing. To exercise these rights, contact our Data Protection Officer at{" "}
            <span className="text-hub-gold font-mono">privacy@codevanta.com</span>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Security Measures</h2>
          <p>
            We implement industry-standard cryptographic password hashing (bcrypt), salted token signatures, HTTP-only
            secure cookies, server-side authorization enforcement, and append-only database transaction logging.
          </p>
        </section>
      </div>
    </div>
  );
}

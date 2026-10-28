import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-hub-gold hover:underline font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border shadow-2xl space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-hub-gold font-bold">
            <FileText className="w-4 h-4" />
            Terms and Conditions
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Before you continue
          </h1>
          <p className="text-sm text-hub-text-secondary leading-relaxed">
            CodeVanta Advanta Hub provides curated developer resources, guides, and membership features.
            By continuing, you agree to use the platform lawfully and responsibly.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-hub-surface-elevated border border-hub-border space-y-2 text-sm text-hub-text-secondary">
          <p>
            You agree not to misuse the platform, submit fraudulent information, or use third-party
            resources in violation of their own terms. Access may be suspended when these conditions are
            violated.
          </p>
          <p>
            Please read our{" "}
            <Link href="/privacy" className="text-hub-gold hover:underline font-medium">
              Privacy Policy
            </Link>{" "}
            to learn how account and usage information is handled.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-hub-border text-sm font-semibold text-hub-text-secondary hover:text-white hover:border-hub-text-muted transition-colors"
          >
            Decline
          </Link>
          <Link
            href="/register"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-hub-gold text-hub-forest-dark text-sm font-bold hover:bg-hub-gold-hover shadow-gold-glow transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Accept and continue
          </Link>
        </div>

        <p className="text-center text-[11px] text-hub-text-muted">
          You can review these terms and the Privacy Policy at any time from the footer.
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tutorial } from "@/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TutorialAIAssistant from "@/components/TutorialAIAssistant";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  ExternalLink,
  Laptop,
  CheckCircle2,
  FileDown,
  Printer,
  Sparkles,
  Info,
  AlertTriangle,
  Loader2,
  Share2,
  Lock,
  ArrowRight,
  X,
} from "lucide-react";

export default function TutorialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [showPaywallNotice, setShowPaywallNotice] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setIsMember(Boolean(data.authenticated && data.entitlements?.planSlug !== "free"));
      })
      .catch(() => setIsMember(false));
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/tutorials/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Tutorial not found");
        return res.json();
      })
      .then((data) => {
        setTutorial(data.tutorial);
        setRelated(data.related || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tutorial");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDownloadPdf = async () => {
    if (!isMember) {
      setShowPaywallNotice(true);
      return;
    }
    if (!tutorial) return;

    try {
      setDownloadingPdf(true);
      const { generateAndDownloadPdf } = await import("@/lib/pdfGenerator");
      generateAndDownloadPdf({
        title: tutorial.title,
        category: tutorial.category,
        difficulty: tutorial.difficulty,
        estimatedMinutes: tutorial.estimated_minutes,
        lastVerifiedDate: tutorial.last_verified_date,
        summary: tutorial.summary,
        prerequisites: tutorial.prerequisites,
        content: tutorial.content,
        slug: tutorial.slug,
      });
    } catch (err) {
      console.error("PDF generation error, fallback to print:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!isMember) {
      setShowPaywallNotice(true);
      return;
    }
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-hub-gold flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading guide &amp; preparing AI companion...</span>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Tutorial Not Found</h2>
        <p className="text-sm text-hub-text-secondary">
          The requested tutorial could not be located. It may have been moved or updated.
        </p>
        <Link
          href="/tutorials"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tutorial Library</span>
        </Link>
      </div>
    );
  }

  const articleJsonLd = tutorial
    ? {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: tutorial.title,
        description: tutorial.summary,
        url: `https://www.codevanta.online/tutorials/${slug}`,
        datePublished: tutorial.created_at,
        dateModified: tutorial.updated_at || tutorial.created_at,
        author: {
          "@type": "Organization",
          name: "CodeVanta Ventures",
          url: "https://www.codevanta.online",
        },
        publisher: {
          "@type": "Organization",
          name: "CodeVanta Ventures",
          logo: {
            "@type": "ImageObject",
            url: "https://www.codevanta.online/favicon.svg",
          },
        },
        proficiencyLevel: tutorial.difficulty,
        dependencies: tutorial.prerequisites?.join(", "),
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative">
      {/* Top Floating Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/[0.04] z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-hub-gold via-amber-400 to-hub-gold transition-[width] duration-150 ease-out shadow-gold-glow"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      {/* Top Navigation & Action Controls */}
      <div className="no-print flex items-center justify-between gap-4 flex-wrap border-b border-white/[0.08] pb-4">
        <Link
          href="/tutorials"
          className="inline-flex items-center gap-2 text-xs font-mono text-hub-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tutorials</span>
        </Link>

        {/* Action Buttons: PDF Export & AI Assistant Jump */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold glass-panel border border-white/15 text-white hover:border-hub-gold/40 transition-all active:scale-95 shadow-sm disabled:opacity-50"
            title="Download PDF guide file directly to your device"
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-hub-gold" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-hub-gold" />
            )}
            <span>{downloadingPdf ? "Generating PDF..." : "Download PDF Guide"}</span>
            {!isMember && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center gap-0.5 border border-amber-500/30">
                <Lock className="w-2.5 h-2.5" /> Pro
              </span>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold glass-panel border border-white/10 text-hub-text-secondary hover:text-white transition-all active:scale-95"
            title="Print or browser Save-as-PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <header className="p-6 sm:p-10 rounded-3xl glass-panel card-specular-edge space-y-5 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-hub-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase font-bold bg-hub-gold/15 border border-hub-gold/30 text-hub-gold shadow-gold-glow">
            {tutorial.category.replace("-", " ")}
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
            {tutorial.difficulty}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-hub-text-muted px-2 py-0.5">
            <Clock className="w-3.5 h-3.5 text-hub-gold" />
            <span>{tutorial.estimated_minutes} min read</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 px-2 py-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified {tutorial.last_verified_date}</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight relative z-10">
          {tutorial.title}
        </h1>

        <p className="text-base sm:text-lg text-hub-text-secondary leading-relaxed max-w-4xl relative z-10">
          {tutorial.summary}
        </p>

        {/* Prerequisites & Supported Environments Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 relative z-10">
          {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
              <span className="text-xs font-mono uppercase font-bold text-hub-gold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hardware &amp; System Prerequisites
              </span>
              <ul className="text-xs text-hub-text-secondary space-y-1.5 list-disc list-inside">
                {tutorial.prerequisites.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {tutorial.supported_os && tutorial.supported_os.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
              <span className="text-xs font-mono uppercase font-bold text-hub-gold flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" />
                Supported Environments
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {tutorial.supported_os.map((os, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-3 py-1 rounded-lg bg-white/[0.04] text-white border border-white/10"
                  >
                    {os}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2-Column Grid: Formatted Markdown Article (No Hashtags) + AI Assistant Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Formatted Markdown Guide */}
        <article className="lg:col-span-8 space-y-8 min-w-0">
          <div className="glass-panel card-specular-edge border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <MarkdownRenderer content={tutorial.content} />

            {/* In-article Paywall Lock for Non-Members */}
            {tutorial.is_locked && (
              <div className="mt-8 pt-8 border-t border-amber-500/30 rounded-3xl bg-gradient-to-b from-amber-950/20 via-black/80 to-black p-6 sm:p-10 text-center backdrop-blur-md shadow-2xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                  <Lock className="w-7 h-7" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Member-Exclusive Content (Preview Mode)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Unlock Complete Step-by-Step Instructions &amp; CLI Commands
                </h3>
                <p className="text-xs sm:text-sm text-hub-text-secondary max-w-lg mx-auto leading-relaxed">
                  The complete implementation steps, terminal commands, configuration files, and troubleshooting runbooks for this guide are reserved for CodeVanta Members.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  <Link
                    href="/plans"
                    className="px-6 py-3 rounded-xl text-sm font-bold bg-hub-gold text-hub-forest-dark hover:brightness-110 shadow-gold-glow transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unlock with CodeVanta Membership (From KES 70)</span>
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95"
                  >
                    <span>Sign In</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Troubleshooting Section */}
          {tutorial.troubleshooting_notes && (
            <section className="p-6 sm:p-8 rounded-3xl bg-amber-950/20 border border-amber-500/40 space-y-3 glass-panel">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-mono uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Common Errors &amp; Troubleshooting Runbook</span>
              </div>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed whitespace-pre-line">
                {tutorial.troubleshooting_notes}
              </p>
            </section>
          )}

          {/* Security & Cost Warning Box */}
          {tutorial.security_warnings && (
            <section className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/40 space-y-3 glass-panel">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-mono uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Security &amp; Cost Guardrails</span>
              </div>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed whitespace-pre-line">
                {tutorial.security_warnings}
              </p>
            </section>
          )}

          {/* Official Documentation Link */}
          {tutorial.official_docs_url && (
            <div className="no-print p-5 rounded-2xl glass-panel card-specular-edge border border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[11px] font-mono uppercase text-hub-text-muted block">Primary Source Documentation</span>
                <span className="text-sm font-bold text-white">Official Provider Specification</span>
              </div>
              <a
                href={tutorial.official_docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-hub-gold text-hub-forest-dark hover:brightness-110 transition-colors shadow-gold-glow"
              >
                <span>Read Official Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </article>

        {/* Right Column: AI Assistant & Quick Actions */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <TutorialAIAssistant
            tutorialTitle={tutorial.title}
            category={tutorial.category}
            summary={tutorial.summary}
          />

          {/* PDF Quick Download Box */}
          <div className="no-print p-6 rounded-3xl glass-panel card-specular-edge border border-white/[0.08] space-y-3.5 text-xs shadow-xl">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4 text-hub-gold" />
              <span>Offline Developer eBook / PDF</span>
            </h4>
            <p className="text-hub-text-secondary leading-relaxed">
              Export this complete guide with tables, hardware benchmarks, and CLI commands cleanly formatted for offline reading.
            </p>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full py-3 rounded-xl font-bold bg-hub-gold text-hub-forest-dark hover:brightness-110 shadow-gold-glow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{downloadingPdf ? "Generating PDF..." : "Download Offline PDF"}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Paywall Modal for Non-Members */}
      {showPaywallNotice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowPaywallNotice(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-hub-surface-card border border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5"
          >
            <button
              onClick={() => setShowPaywallNotice(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-hub-text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">
                Member-Exclusive Perk
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Offline PDF Guides &amp; Starter Kits
              </h3>
              <p className="text-xs text-hub-text-secondary leading-relaxed">
                Offline PDF export, cloneable GitHub starter repositories, and architecture blueprint files are reserved for CodeVanta Pro &amp; VIP members. Upgrade today for instant lifetime access.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/plans"
                className="w-full py-3 rounded-xl text-center text-xs font-semibold bg-hub-gold hover:bg-hub-gold-hover text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>View Membership Plans (From KES 150)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowPaywallNotice(false)}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-hub-text-muted hover:text-white transition-colors"
              >
                Continue Reading Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related Tutorials Strip */}
      {related && related.length > 0 && (
        <div className="no-print space-y-4 pt-8 border-t border-white/10">
          <h3 className="text-lg font-bold text-white">Related Tutorials &amp; Next Steps</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/tutorials/${item.slug}`}
                className="p-4 rounded-xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/50 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-hub-gold">
                  <span className="uppercase">{item.difficulty}</span>
                  <span>{item.estimated_minutes}m read</span>
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-hub-gold transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-hub-text-secondary line-clamp-2">{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

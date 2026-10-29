"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TutorialAIAssistant from "@/components/TutorialAIAssistant";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  ListTree,
  ShieldCheck,
  FileDown,
  Printer,
  Sparkles,
  Lock,
  ArrowRight,
  X,
} from "lucide-react";

interface Tutorial {
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  estimated_minutes: number;
  introduction: string;
  content: string;
  prerequisites: string[];
  supported_operating_systems: string[];
  steps: Array<{ title: string; instruction: string }>;
  references: Array<{ title: string; url: string }>;
  last_verified_date: string;
  is_locked?: boolean;
  is_preview?: boolean;
}

export default function TutorialDetailPage({ params }: { params: { slug: string } }) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Array<{ slug: string; title: string }>>([]);
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
    fetch(`/api/guides/${params.slug}`)
      .then((response) => response.json())
      .then((data) => {
        setTutorial(data.tutorial || null);
        setRelated(data.related || []);
      });
  }, [params.slug]);

  const sections = useMemo(
    () =>
      tutorial?.content
        .match(/^## .+$/gm)
        ?.map((item) => item.replace(/^## /, "")) || [],
    [tutorial]
  );

  const handlePrintPdf = () => {
    if (!isMember) {
      setShowPaywallNotice(true);
      return;
    }
    window.print();
  };

  if (!tutorial) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center text-hub-text-muted">
        Loading guide...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Bar */}
      <div className="no-print flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-4">
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 text-xs font-mono text-hub-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> All Starter Kits &amp; Guides
        </Link>

        <button
          onClick={handlePrintPdf}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95 shadow-sm"
        >
          <FileDown size={14} className="text-hub-gold" />
          <span>Download PDF Guide</span>
          {!isMember && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center gap-0.5">
              <Lock size={10} /> Pro
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px] items-start">
        {/* Main Article */}
        <article className="min-w-0 space-y-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-hub-gold">
              <span>{tutorial.category}</span>
              <span>·</span>
              <span className="capitalize">{tutorial.difficulty}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              {tutorial.title}
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-hub-text-secondary">
              {tutorial.introduction || tutorial.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-mono text-hub-text-muted">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-hub-gold" /> {tutorial.estimated_minutes} min read
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={14} /> Verified {tutorial.last_verified_date || "Active"}
              </span>
            </div>
          </div>

          {/* Prerequisites & Supported Systems */}
          <div className="grid gap-4 rounded-2xl border border-hub-border bg-hub-surface p-5 sm:grid-cols-2 text-xs">
            <div>
              <h2 className="font-semibold text-white font-mono uppercase text-hub-gold">Prerequisites</h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-hub-text-secondary">
                {tutorial.prerequisites && tutorial.prerequisites.length > 0 ? (
                  tutorial.prerequisites.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>Standard Node.js / Docker environment</li>
                )}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold text-white font-mono uppercase text-hub-gold">Supported Systems</h2>
              <p className="mt-2 text-hub-text-secondary">
                {tutorial.supported_operating_systems?.join(", ") || "Linux, macOS, Windows"}
              </p>
            </div>
          </div>

          {/* Steps if structured */}
          {tutorial.steps && tutorial.steps.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <ListTree size={18} className="text-hub-gold" /> Blueprint Steps
              </h2>
              <div className="space-y-3">
                {tutorial.steps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-hub-border bg-hub-surface p-5">
                    <div className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hub-gold text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm">{step.title}</h3>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-hub-text-secondary whitespace-pre-line">
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clean Markdown Article Body (No Hashtags) */}
          <div className="bg-hub-surface-card border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <MarkdownRenderer content={tutorial.content} />

            {/* In-article Paywall Lock for Non-Members */}
            {tutorial.is_locked && (
              <div className="mt-8 pt-8 border-t border-amber-500/30 rounded-2xl bg-gradient-to-b from-amber-950/20 via-black/80 to-black p-6 sm:p-10 text-center backdrop-blur-md shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                  <Lock size={24} />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Member-Exclusive Content (Preview Mode)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Unlock Full Architectural Blueprint &amp; Instructions
                </h3>
                <p className="text-xs sm:text-sm text-hub-text-secondary max-w-lg mx-auto leading-relaxed">
                  The complete implementation steps, terminal commands, configuration files, and troubleshooting runbooks for this guide are reserved for CodeVanta Members.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  <Link
                    href="/plans"
                    className="px-6 py-3 rounded-xl text-sm font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover shadow-gold-glow transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Lock size={16} />
                    <span>Unlock with CodeVanta Membership (From KES 150)</span>
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

          {/* External References */}
          {tutorial.references && tutorial.references.length > 0 && (
            <div className="no-print pt-4 border-t border-white/10 flex flex-wrap gap-2.5">
              {tutorial.references.map((reference) => (
                <a
                  key={reference.url}
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-hub-border bg-hub-surface px-3 py-1.5 text-xs text-hub-text-secondary hover:border-hub-gold hover:text-white transition-colors"
                >
                  <span>{reference.title}</span>
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          )}
        </article>

        {/* Sidebar: AI Companion & Table of Contents */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <TutorialAIAssistant
            tutorialTitle={tutorial.title}
            category={tutorial.category}
            summary={tutorial.summary || tutorial.introduction}
          />

          {/* Quick PDF Card */}
          <div className="no-print p-5 rounded-2xl bg-hub-surface border border-white/10 space-y-2.5 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Printer size={15} className="text-hub-gold" />
              <span>Offline Reader PDF</span>
            </h4>
            <p className="text-hub-text-secondary leading-relaxed">
              Export this architectural guide formatted for clean paper or offline PDF reading.
            </p>
            <button
              onClick={handlePrintPdf}
              className="w-full py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <FileDown size={14} className="text-hub-gold" />
              <span>Export as PDF</span>
            </button>
          </div>

          {/* Sections Index */}
          {sections.length > 0 && (
            <div className="no-print rounded-2xl border border-hub-border bg-hub-surface p-5 text-xs space-y-3">
              <h2 className="font-bold text-white uppercase tracking-wider font-mono text-[11px] text-hub-gold">
                On this page
              </h2>
              <ul className="space-y-2 text-hub-text-muted">
                {sections.map((section, idx) => (
                  <li key={idx} className="hover:text-white transition-colors">
                    {section}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related guides */}
          {related.length > 0 && (
            <div className="no-print rounded-2xl border border-hub-border bg-hub-surface p-5 text-xs space-y-3">
              <h2 className="font-bold text-white uppercase tracking-wider font-mono text-[11px] text-hub-gold">
                Related guides
              </h2>
              <div className="space-y-2">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/guides/${item.slug}`}
                    className="block text-hub-text-secondary hover:text-hub-gold transition-colors truncate"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
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
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
              <Lock size={24} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">
                Pro &amp; VIP Benefit
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Offline PDF Guides &amp; Blueprints
              </h3>
              <p className="text-xs text-hub-text-secondary leading-relaxed">
                Clean offline PDF export, cloneable GitHub repositories, and system architecture runbooks are reserved for CodeVanta Pro &amp; VIP members. Upgrade today for instant lifetime access.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/plans"
                className="w-full py-3 rounded-xl text-center text-xs font-semibold bg-hub-gold hover:bg-hub-gold-hover text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>View Membership Plans (From KES 150)</span>
                <ArrowRight size={14} />
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
    </main>
  );
}

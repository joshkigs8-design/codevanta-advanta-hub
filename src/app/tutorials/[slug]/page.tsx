"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tutorial } from "@/types";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Laptop,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function TutorialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-hub-gold flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading tutorial...</span>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <div>
        <Link
          href="/tutorials"
          className="inline-flex items-center gap-2 text-xs font-mono text-hub-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tutorials</span>
        </Link>
      </div>

      {/* Header Container */}
      <header className="space-y-4 border-b border-white/10 pb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold bg-hub-surface border border-hub-border text-hub-gold">
            {tutorial.category.replace("-", " ")}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
            {tutorial.difficulty}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-hub-text-muted">
            <Clock className="w-3.5 h-3.5 text-hub-gold" />
            <span>{tutorial.estimated_minutes} min read</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified {tutorial.last_verified_date}</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {tutorial.title}
        </h1>

        <p className="text-base sm:text-lg text-hub-text-secondary leading-relaxed max-w-3xl">
          {tutorial.summary}
        </p>

        {/* Prerequisites & Supported OS metadata strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
            <div className="p-4 rounded-xl bg-hub-surface border border-hub-border space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-hub-gold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Prerequisites
              </span>
              <ul className="text-xs text-hub-text-secondary space-y-1 list-disc list-inside">
                {tutorial.prerequisites.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {tutorial.supported_os && tutorial.supported_os.length > 0 && (
            <div className="p-4 rounded-xl bg-hub-surface border border-hub-border space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-hub-gold flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" />
                Supported Environments
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tutorial.supported_os.map((os, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2.5 py-1 rounded-md bg-hub-surface-elevated text-white border border-white/10"
                  >
                    {os}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <article className="prose prose-invert max-w-none space-y-6 text-sm text-hub-text-secondary leading-relaxed font-sans">
        <div className="whitespace-pre-line bg-hub-surface-card border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
          {tutorial.content}
        </div>
      </article>

      {/* Troubleshooting Section */}
      {tutorial.troubleshooting_notes && (
        <section className="p-6 rounded-2xl bg-amber-950/30 border border-amber-600/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-mono uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Common Errors &amp; Troubleshooting</span>
          </div>
          <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
            {tutorial.troubleshooting_notes}
          </p>
        </section>
      )}

      {/* Security & Cost Warning Box */}
      {tutorial.security_warnings && (
        <section className="p-6 rounded-2xl bg-rose-950/30 border border-rose-600/40 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-mono uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Security &amp; Cost Guardrails</span>
          </div>
          <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
            {tutorial.security_warnings}
          </p>
        </section>
      )}

      {/* Official Documentation Link */}
      {tutorial.official_docs_url && (
        <div className="p-4 rounded-xl bg-hub-surface border border-hub-border flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-mono uppercase text-hub-text-muted block">Primary Source Documentation</span>
            <span className="text-sm font-semibold text-white">Official Provider Specification</span>
          </div>
          <a
            href={tutorial.official_docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover transition-colors shadow-md"
          >
            <span>Read Official Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Related Tutorials */}
      {related && related.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-white/10">
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

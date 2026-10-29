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
}

export default function TutorialDetailPage({ params }: { params: { slug: string } }) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Array<{ slug: string; title: string }>>([]);

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
          <div className="bg-hub-surface-card border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <MarkdownRenderer content={tutorial.content} />
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
    </main>
  );
}

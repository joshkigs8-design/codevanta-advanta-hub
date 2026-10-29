"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LearningGuide } from "@/types";
import { UserEntitlements } from "@/lib/entitlements";
import {
  BookOpen,
  Lock,
  Download,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function GuidesPage() {
  const [guides, setGuides] = useState<Array<LearningGuide & { is_locked?: boolean }>>([]);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [activeGuide, setActiveGuide] = useState<(LearningGuide & { is_locked?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guides")
      .then((res) => res.json())
      .then((data) => {
        if (data.guides && data.guides.length > 0) {
          setGuides(data.guides);
          setActiveGuide(data.guides[0]);
        }
        if (data.entitlements) {
          setEntitlements(data.entitlements);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canAccessGuide = (guide: LearningGuide & { is_locked?: boolean }): boolean => {
    return !guide.is_locked;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-hub-border pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-hub-gold font-bold">
          <BookOpen className="w-4 h-4" />
          <span>Curated Learning Roadmaps &amp; Blueprints</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Practical Guides &amp; Architecture Blueprints
        </h1>
        <p className="text-sm text-hub-text-secondary max-w-2xl">
          Original tutorials with production-ready code examples. Locked blueprints and starter kits are available exclusively to our membership tiers.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-hub-text-muted">Loading learning modules…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guides List */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-hub-text-muted font-bold">
              Available Modules
            </h3>

            <div className="space-y-3">
              {guides.map((g) => {
                const hasAccess = canAccessGuide(g);
                const isSelected = activeGuide?.id === g.id;

                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGuide(g)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-hub-surface-elevated border-hub-gold shadow-md"
                        : "bg-hub-surface-card border-hub-border hover:border-hub-gold/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-hub-surface text-hub-text-secondary border border-hub-border">
                        {g.category}
                      </span>

                      {g.min_plan_tier !== "free" ? (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                            hasAccess
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : "bg-amber-950/80 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {hasAccess ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {g.min_plan_tier.toUpperCase()} TIER
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-hub-forest text-hub-gold border border-hub-gold/30">
                          FREE ACCESS
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-hub-text-primary leading-snug">
                      {g.title}
                    </h4>

                    <div className="flex items-center gap-3 mt-3 text-[11px] text-hub-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {g.estimated_minutes} min read
                      </span>
                      <span className="capitalize">{g.difficulty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide Content Display */}
          <div className="lg:col-span-2">
            {activeGuide ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-hub-gold font-semibold">
                      {activeGuide.category}
                    </span>
                    <span className="text-hub-text-muted">•</span>
                    <span className="text-xs text-hub-text-muted font-mono">{activeGuide.estimated_minutes} min read</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {activeGuide.title}
                  </h2>

                  <p className="text-sm text-hub-text-secondary mt-2">
                    {activeGuide.summary}
                  </p>
                </div>

                {/* Gating Check */}
                {canAccessGuide(activeGuide) ? (
                  <div className="space-y-6 pt-4 border-t border-hub-border">
                    {/* Starter Kit Download Banner */}
                    {activeGuide.starter_kit_download_url && (
                      <div className="p-4 rounded-xl bg-hub-surface-elevated border border-hub-gold/40 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-mono uppercase text-hub-gold font-bold">
                            Official Starter Kit Available
                          </span>
                          <p className="text-xs text-hub-text-secondary">
                            Includes pre-configured repo with TypeScript, database migrations, and environment templates.
                          </p>
                        </div>
                        <a
                          href={activeGuide.starter_kit_download_url}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-hub-gold text-white hover:bg-hub-gold-hover shrink-0 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download ZIP
                        </a>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none text-sm text-hub-text-secondary space-y-4 leading-relaxed font-sans">
                      <div className="whitespace-pre-line">
                        {activeGuide.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-hub-surface-elevated border border-hub-border text-center space-y-4 my-6">
                    <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {activeGuide.min_plan_tier.toUpperCase()} Membership Required
                    </h3>
                    <p className="text-xs text-hub-text-secondary max-w-md mx-auto">
                      This production architecture blueprint, code files, and downloadable repository are restricted to{" "}
                      <strong className="text-white">{activeGuide.min_plan_tier.toUpperCase()}</strong> tier members.
                    </p>
                    <Link
                      href={`/plans?select=${activeGuide.min_plan_tier}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover shadow-gold-glow"
                    >
                      <span>Unlock with {activeGuide.min_plan_tier.toUpperCase()} Membership</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-hub-text-muted">
                Select a learning guide from the list to view its contents.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

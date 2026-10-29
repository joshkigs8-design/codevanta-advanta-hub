"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LearningPath } from "@/types";
import {
  Compass,
  Code2,
  Sparkles,
  Cpu,
  Terminal,
  Server,
  Cloud,
  Layers,
  GitBranch,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  Sparkles,
  Cpu,
  Terminal,
  Server,
  Cloud,
  Layers,
  GitBranch,
  Compass,
};

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<Array<LearningPath & { is_locked?: boolean; lock_reason?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isEntitled, setIsEntitled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/learning-paths")
      .then((res) => res.json())
      .then((data) => {
        setPaths(data.paths || []);
        setIsEntitled(Boolean(data.isEntitled));
        setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setPaths([]))
      .finally(() => setLoading(false));
  }, []);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
            Beginner Friendly
          </span>
        );
      case "intermediate":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-amber-950/70 text-amber-300 border border-amber-800/50">
            Intermediate
          </span>
        );
      case "advanced":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-rose-950/70 text-rose-300 border border-rose-800/50">
            Advanced
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-white/10 text-white/70">
            All Levels
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-hub-gold font-bold bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-md">
          <Compass className="w-3.5 h-3.5" />
          <span>Curated Developer Roadmaps</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Structured Learning Paths
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl leading-relaxed">
          Follow ordered milestones and hands-on tutorials designed to take you from foundational programming
          concepts to autonomous AI coding agents, cloud microservices, and full-stack software production.
        </p>
      </div>

      {/* Paywall Banner for Non-Entitled / Free / Guest */}
      {!loading && !isEntitled && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-black/80 to-rose-950/40 border border-amber-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Pro & VIP Membership Paywall</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Unlock Complete Step-by-Step Tracks
              </h3>
              <p className="text-sm text-hub-text-secondary leading-relaxed">
                CodeVanta Pro &amp; VIP members get full access to all multi-week guided engineering tracks,
                milestone tracking, production architecture diagrams, and direct WhatsApp / Discord support.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover shadow-gold-glow transition-all active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Upgrade to Unlock All Tracks</span>
              </Link>
              {!authenticated && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading learning paths...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paths.map((p) => {
            const IconComponent = ICON_MAP[p.icon] || Compass;
            const isLocked = Boolean(p.is_locked);

            return (
              <div
                key={p.id}
                className={`group relative flex flex-col justify-between rounded-2xl border transition-all p-6 shadow-md overflow-hidden ${
                  isLocked
                    ? "bg-hub-surface-card/70 border-amber-500/30"
                    : "bg-hub-surface-card border-white/10 hover:border-hub-gold/50 hover:-translate-y-1 hover:shadow-card-subtle"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-hub-gold group-hover:bg-hub-gold group-hover:text-white transition-all">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {isLocked ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Pro Track</span>
                      </span>
                    ) : (
                      getDifficultyBadge(p.difficulty)
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-hub-gold font-bold block mb-1">
                      {p.category}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-hub-gold transition-colors leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-xs text-hub-text-secondary mt-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-hub-text-muted font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-hub-gold" />
                    <span>~{p.estimated_hours} hours</span>
                  </div>

                  {isLocked ? (
                    <Link
                      href="/plans"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition-colors"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Unlock</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/tutorials?category=${
                        p.slug.includes("ollama")
                          ? "local-ai"
                          : p.slug.includes("agent")
                          ? "ai-coding-agents"
                          : p.slug.includes("cloud") || p.slug.includes("deployment")
                          ? "deployment"
                          : ""
                      }`}
                      className="inline-flex items-center gap-1 text-hub-gold font-semibold group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Start Path</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

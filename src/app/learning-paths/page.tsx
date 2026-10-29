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
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/learning-paths")
      .then((res) => res.json())
      .then((data) => setPaths(data.paths || []))
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

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading learning paths...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paths.map((p, idx) => {
            const IconComponent = ICON_MAP[p.icon] || Compass;

            return (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/50 transition-all p-6 shadow-md hover:-translate-y-1 hover:shadow-card-subtle overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-hub-gold group-hover:bg-hub-gold group-hover:text-white transition-all">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {getDifficultyBadge(p.difficulty)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

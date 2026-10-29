"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GuidedProject } from "@/types";
import {
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Github,
  Loader2,
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<GuidedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]))
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
          <Layers className="w-3.5 h-3.5" />
          <span>Hands-on Engineering Lab</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Practical Project Lab
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl leading-relaxed">
          Guided full-stack projects with verified prerequisites, starter code, expected outcomes, and step-by-step
          implementation instructions. Build real software for your portfolio.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading project lab...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/50 transition-all p-6 shadow-md hover:-translate-y-1 hover:shadow-card-subtle"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  {getDifficultyBadge(proj.difficulty)}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-hub-text-muted">
                    <Clock className="w-3.5 h-3.5 text-hub-gold" />
                    <span>~{proj.estimated_hours}h build time</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-hub-gold transition-colors leading-snug">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-hub-text-secondary mt-2 leading-relaxed">
                    {proj.summary}
                  </p>
                </div>

                {/* Tech Stack Pills */}
                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tech_stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-hub-surface-elevated text-white/90 border border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expected Outcome Box */}
                <div className="p-3 rounded-xl bg-hub-surface border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-hub-gold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Expected Outcome
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {proj.expected_outcomes}
                  </p>
                </div>

                {/* Paid Services Warning */}
                {proj.paid_services_warning && (
                  <div className="text-[11px] text-hub-text-muted flex items-start gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{proj.paid_services_warning}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                {proj.starter_code_repo_url ? (
                  <a
                    href={proj.starter_code_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-hub-text-secondary hover:text-white transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Starter Repo</span>
                  </a>
                ) : (
                  <span />
                )}

                <Link
                  href={proj.demo_url || `/tutorials`}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover shadow-md transition-all active:scale-95"
                >
                  <span>Start Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


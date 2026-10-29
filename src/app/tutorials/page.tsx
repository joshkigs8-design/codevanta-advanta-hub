"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tutorial } from "@/types";
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Cpu,
  Terminal,
  Cloud,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  { id: "", label: "All Topics", icon: BookOpen },
  { id: "local-ai", label: "Local AI & Ollama", icon: Cpu },
  { id: "ai-coding-agents", label: "AI Coding Agents", icon: Terminal },
  { id: "ides-tools", label: "IDEs & Editors", icon: Sparkles },
  { id: "cloud-remote", label: "Cloud & Remote Dev", icon: Cloud },
  { id: "deployment", label: "Hosting & Databases", icon: Layers },
];

function TutorialsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  const fetchTutorials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedDifficulty) params.set("difficulty", selectedDifficulty);

      const res = await fetch(`/api/tutorials?${params.toString()}`);
      const data = await res.json();
      setTutorials(data.tutorials || []);
    } catch {
      setTutorials([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTutorials();
    }, 200);
    return () => clearTimeout(handler);
  }, [fetchTutorials]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedDifficulty("");
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
            Beginner
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
          <BookOpen className="w-3.5 h-3.5" />
          <span>Practical Technical Knowledgebase</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Developer Tutorials &amp; AI Setup Guides
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl leading-relaxed">
          Step-by-step engineering tutorials: local LLM inference with Ollama, autonomous AI coding agents,
          IDE setups, and cloud hosting blueprints. Tested with real terminal commands.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutorials by topic, command, model, or tool (e.g. Ollama, Claude, Next.js)..."
              className="w-full px-4 py-3 pl-10 rounded-xl bg-hub-surface border border-hub-border focus:border-hub-gold focus:outline-none text-sm text-white placeholder-hub-text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-3.5 text-hub-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-hub-surface border border-hub-border focus:border-hub-gold focus:outline-none text-sm text-white shrink-0"
          >
            <option value="">All Difficulty Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Category Pill Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected && cat.id !== "" ? "" : cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-hub-gold text-white font-bold shadow-gold-glow"
                    : "bg-hub-surface text-hub-text-secondary hover:text-white border border-hub-border hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-hub-text-muted">
        <span>
          Showing {tutorials.length} verified technical tutorial{tutorials.length === 1 ? "" : "s"}
        </span>
        {loading && (
          <span className="flex items-center gap-1.5 text-hub-gold font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Updating results...
          </span>
        )}
      </div>

      {/* Tutorials Grid */}
      {tutorials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tut) => (
            <Link
              key={tut.id}
              href={`/tutorials/${tut.slug}`}
              className="group relative flex flex-col justify-between rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/50 transition-all p-6 shadow-md hover:-translate-y-1 hover:shadow-card-subtle overflow-hidden"
            >
              <div className="space-y-4">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  {getDifficultyBadge(tut.difficulty)}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-hub-text-muted">
                    <Clock className="w-3 h-3 text-hub-gold" />
                    <span>{tut.estimated_minutes} min read</span>
                  </div>
                </div>

                {/* Title & Summary */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-hub-gold transition-colors leading-snug">
                    {tut.title}
                  </h3>
                  <p className="text-xs text-hub-text-secondary mt-2 line-clamp-3 leading-relaxed">
                    {tut.summary}
                  </p>
                </div>

                {/* Supported OS Badges */}
                {tut.supported_os && tut.supported_os.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tut.supported_os.map((os) => (
                      <span
                        key={os}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70"
                      >
                        {os}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified {tut.last_verified_date}</span>
                </div>
                <div className="flex items-center gap-1 text-hub-gold font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4 rounded-2xl bg-hub-surface border border-hub-border p-8">
          <div className="w-12 h-12 rounded-full bg-hub-surface-elevated mx-auto flex items-center justify-center text-hub-text-muted">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Matching Tutorials Found</h3>
          <p className="text-sm text-hub-text-secondary max-w-sm mx-auto">
            Try adjusting your search terms or clearing the topic and difficulty filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function TutorialsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading tutorial library...</span>
        </div>
      }
    >
      <TutorialsContent />
    </Suspense>
  );
}

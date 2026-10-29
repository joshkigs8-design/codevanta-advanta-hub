"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TroubleshootingEntry } from "@/types";
import {
  Wrench,
  Search,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Calendar,
  Terminal,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function TroubleshootingPage() {
  const [entries, setEntries] = useState<TroubleshootingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetch("/api/troubleshooting")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "all",
    ...Array.from(new Set(entries.map((e) => e.category))),
  ];

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory =
      selectedCategory === "all" || entry.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      entry.error_message.toLowerCase().includes(q) ||
      entry.affected_tool.toLowerCase().includes(q) ||
      entry.likely_causes.toLowerCase().includes(q) ||
      entry.step_by_step_fix.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-hub-gold font-bold bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-md">
          <Wrench className="w-3.5 h-3.5" />
          <span>Diagnostic Runbooks</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Developer Troubleshooting Centre
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl leading-relaxed">
          Step-by-step diagnostic solutions for local LLM daemon crashes, CUDA VRAM out-of-memory errors, Next.js build timeouts, and API credential issues.
        </p>

        {/* Search & Filter Controls */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-hub-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search error message, tool name, or error code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-hub-surface border border-white/10 text-white placeholder-hub-text-muted text-sm focus:outline-none focus:border-hub-gold/60 focus:ring-1 focus:ring-hub-gold/60 transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                  selectedCategory === cat
                    ? "bg-hub-gold text-white font-semibold shadow-md"
                    : "bg-hub-surface-elevated text-hub-text-secondary hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Diagnostics List */}
      {loading ? (
        <div className="py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading troubleshooting diagnostics...</span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-hub-surface border border-white/5 space-y-3">
          <AlertOctagon className="w-10 h-10 text-hub-text-muted mx-auto" />
          <h3 className="text-lg font-bold text-white">No matching error records found</h3>
          <p className="text-xs text-hub-text-secondary max-w-md mx-auto">
            Try adjusting your search terms or view our complete tutorial guides for setup walk-throughs.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="text-xs font-mono text-hub-gold underline pt-2 inline-block"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEntries.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/40 transition-all p-6 shadow-md space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-hub-surface-elevated text-hub-gold border border-hub-gold/30">
                    {item.affected_tool}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono text-hub-text-muted bg-white/5 border border-white/5">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-hub-text-muted">
                  <Calendar className="w-3.5 h-3.5 text-hub-gold" />
                  <span>Verified: {item.last_verified_date}</span>
                </div>
              </div>

              {/* Error Callout */}
              <div className="p-4 rounded-xl bg-black/60 border border-rose-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase font-bold tracking-wider">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>Reported Error / Stack Trace</span>
                </div>
                <div className="font-mono text-xs sm:text-sm text-rose-200/90 whitespace-pre-wrap break-all pl-6">
                  {item.error_message}
                </div>
              </div>

              {/* Grid: Likely Causes & Step-by-Step Fix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
                {/* Likely Causes */}
                <div className="space-y-2 p-4 rounded-xl bg-hub-surface border border-white/5">
                  <h4 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Likely Root Causes</span>
                  </h4>
                  <div className="text-xs text-hub-text-secondary leading-relaxed whitespace-pre-line pl-5">
                    {item.likely_causes}
                  </div>
                </div>

                {/* Step-by-Step Fix */}
                <div className="space-y-2 p-4 rounded-xl bg-hub-surface border border-white/5">
                  <h4 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Step-by-Step Resolution</span>
                  </h4>
                  <div className="text-xs text-white/90 leading-relaxed whitespace-pre-line pl-5 font-mono">
                    {item.step_by_step_fix}
                  </div>
                </div>
              </div>

              {/* Verification & Official Documentation */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-white/5">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-hub-text-secondary">
                    <strong className="text-white">Verification:</strong> {item.verification_steps}
                  </span>
                </div>

                {item.official_docs_url && (
                  <a
                    href={item.official_docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-hub-gold hover:text-hub-gold-hover font-mono underline shrink-0 transition-colors"
                  >
                    <span>Official Diagnostic Docs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


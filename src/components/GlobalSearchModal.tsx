"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  BookOpen,
  Compass,
  Layers,
  Wrench,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { SearchResultItem } from "@/app/api/search/route";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via custom event or parent
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tutorial":
        return <BookOpen className="w-4 h-4 text-hub-gold shrink-0" />;
      case "resource":
        return <Compass className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "learning_path":
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
      case "troubleshooting":
        return <Wrench className="w-4 h-4 text-rose-400 shrink-0" />;
      case "project":
        return <Layers className="w-4 h-4 text-amber-400 shrink-0" />;
      case "student_benefit":
        return <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />;
      default:
        return <Search className="w-4 h-4 text-hub-text-muted shrink-0" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "tutorial":
        return "Tutorial";
      case "resource":
        return "Developer Tool / API";
      case "learning_path":
        return "Learning Path";
      case "troubleshooting":
        return "Troubleshooting Runbook";
      case "project":
        return "Project Lab";
      case "student_benefit":
        return "Student Perk";
      default:
        return "Resource";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-hub-surface-card border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/10 px-4 py-3 bg-black/40">
          <Search className="w-5 h-5 text-hub-gold mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tutorials, Ollama, APIs, CUDA errors, student perks..."
            className="w-full bg-transparent text-white placeholder-hub-text-muted text-sm sm:text-base focus:outline-none font-mono"
          />
          {loading && <Loader2 className="w-4 h-4 text-hub-gold animate-spin mr-2" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded hover:bg-white/10 text-hub-text-muted hover:text-white mr-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded text-[11px] font-mono text-hub-text-muted hover:text-white bg-white/5 border border-white/10 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1 scrollbar-thin">
          {!query || query.trim().length < 2 ? (
            <div className="py-8 text-center text-xs text-hub-text-muted space-y-2">
              <p>Type at least 2 characters to search across tutorials, APIs, learning paths & runbooks.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={() => setQuery("ollama")}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-hub-gold border border-white/5"
                >
                  ollama
                </button>
                <button
                  onClick={() => setQuery("cuda")}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-hub-gold border border-white/5"
                >
                  cuda
                </button>
                <button
                  onClick={() => setQuery("gemini")}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-hub-gold border border-white/5"
                >
                  gemini
                </button>
                <button
                  onClick={() => setQuery("student")}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-hub-gold border border-white/5"
                >
                  student
                </button>
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-xs text-hub-text-muted">
              No results found for &quot;<span className="text-white font-mono">{query}</span>&quot;. Try checking for typos or different keywords.
            </div>
          ) : (
            results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item.url)}
                className="group flex items-start gap-3 p-3 rounded-xl bg-hub-surface hover:bg-hub-surface-elevated border border-white/5 hover:border-hub-gold/40 cursor-pointer transition-all"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-black/40 border border-white/5 group-hover:border-hub-gold/30 transition-colors">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-hub-text-muted">
                      {getTypeLabel(item.type)}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/80">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-hub-gold transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-hub-text-secondary truncate mt-0.5">
                    {item.description}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-hub-text-muted group-hover:text-hub-gold group-hover:translate-x-0.5 transition-all self-center shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-4 py-2 bg-black/50 flex items-center justify-between text-[11px] font-mono text-hub-text-muted">
          <span>Search across 50+ guides, tools, and runbooks</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Resource, Category, PricingClassification, SkillLevel } from "@/types";
import ResourceCard from "@/components/ResourceCard";
import ResourceDetailModal from "@/components/ResourceDetailModal";
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  Key,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function DirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Filters state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [pricing, setPricing] = useState<PricingClassification | "">(
    (searchParams.get("pricing") as PricingClassification) || ""
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [noCreditCard, setNoCreditCard] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [sort, setSort] = useState("featured");
  const [totalCount, setTotalCount] = useState(0);
  const [authStatus, setAuthStatus] = useState<
    { state: "loading" | "authenticated" | "guest"; isMember: boolean }
  >({
    state: "loading",
    isMember: false,
  });

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/resources?limit=1")
      .then(() => {
        setCategories([
          { id: "cat-apis", slug: "public-apis", name: "Public APIs", description: "", icon: "Globe", display_order: 1, created_at: "" },
          { id: "cat-ai-models", slug: "ai-apis-models", name: "AI Models & APIs", description: "", icon: "Brain", display_order: 2, created_at: "" },
          { id: "cat-ai-coding", slug: "ai-coding-assistants", name: "AI Coding", description: "", icon: "Sparkles", display_order: 3, created_at: "" },
          { id: "cat-hosting", slug: "hosting-deployment", name: "Cloud Hosting", description: "", icon: "Server", display_order: 4, created_at: "" },
          { id: "cat-databases", slug: "databases-backends", name: "Databases", description: "", icon: "Database", display_order: 5, created_at: "" },
          { id: "cat-auth", slug: "auth-security", name: "Auth & Security", description: "", icon: "Shield", display_order: 6, created_at: "" },
          { id: "cat-payments", slug: "payments-fintech", name: "Payments & M-Pesa", description: "", icon: "CreditCard", display_order: 7, created_at: "" },
          { id: "cat-student", slug: "student-benefits", name: "Student Perks", description: "", icon: "GraduationCap", display_order: 8, created_at: "" },
          { id: "cat-cybersecurity", slug: "cybersecurity-labs", name: "Cybersecurity", description: "", icon: "Lock", display_order: 9, created_at: "" },
          { id: "cat-templates", slug: "starter-templates", name: "Templates & Kits", description: "", icon: "Code2", display_order: 10, created_at: "" },
        ]);
      })
      .catch(() => {});
  }, []);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (selectedCategory) params.set("category", selectedCategory);
      if (pricing) params.set("pricing", pricing);
      if (skillLevel) params.set("skill_level", skillLevel);
      if (noCreditCard) params.set("no_credit_card", "true");
      if (noApiKey) params.set("no_api_key", "true");
      if (sort) params.set("sort", sort);
      params.set("limit", "50");

      const res = await fetch(`/api/resources?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load directory resources (${res.status})`);
      }
      const data = await res.json();
      setResources(data.resources || []);
      setTotalCount(data.total || 0);
      setAuthStatus({
        state: data.authenticated ? "authenticated" : "guest",
        isMember: Boolean(data.isMember),
      });
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, pricing, skillLevel, noCreditCard, noApiKey, sort]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchResources();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchResources]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setPricing("");
    setSkillLevel("");
    setNoCreditCard(false);
    setNoApiKey(false);
    setSort("featured");
  };

  const hasActiveFilters = Boolean(
    query || selectedCategory || pricing || skillLevel || noCreditCard || noApiKey || sort !== "featured"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Curated Developer Database</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Developer Resources &amp; <span className="shimmer-gold">Free Tiers</span>
        </h1>
        <p className="text-sm text-hub-text-secondary max-w-2xl leading-relaxed">
          Verified developer APIs, generous cloud infrastructure, AI models, and student perks.
          Every entry is tested for genuine free quotas with zero unexpected card surprises.
        </p>
      </div>

      {/* Search Bar & Quick Categories */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-hub-gold" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tool name, language (Python, TypeScript), or capability..."
              className="w-full px-4 py-3 pl-12 rounded-xl bg-hub-surface border border-white/[0.1] focus:border-hub-gold focus:outline-none text-sm text-white placeholder:text-hub-text-muted transition-colors font-mono placeholder:font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-3.5 text-hub-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-hub-surface border border-white/[0.1] focus:border-hub-gold focus:outline-none text-xs font-semibold text-white"
            >
              <option value="featured">Sort: Featured</option>
              <option value="verified">Sort: Recently Verified</option>
              <option value="clicks">Sort: Most Popular</option>
              <option value="newest">Sort: Recently Added</option>
              <option value="name">Sort: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Category Pill Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              !selectedCategory
                ? "bg-amber-400 text-black shadow-gold-glow"
                : "bg-white/[0.04] text-hub-text-secondary hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? "" : cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? "bg-amber-400 text-black shadow-gold-glow"
                  : "bg-white/[0.04] text-hub-text-secondary hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Drawer / Bar */}
      <div className="p-4 rounded-xl glass-panel flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-hub-gold font-bold flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters:
          </span>

          {/* Pricing classification */}
          <select
            value={pricing}
            onChange={(e) => setPricing(e.target.value as PricingClassification | "")}
            className="px-3 py-1.5 rounded-lg bg-hub-surface border border-white/[0.1] text-white focus:outline-none focus:border-hub-gold"
          >
            <option value="">All Pricing Models</option>
            <option value="free_and_open_source">Free &amp; Open Source</option>
            <option value="free_hosted_service">Free Hosted Service</option>
            <option value="freemium">Freemium</option>
            <option value="limited_trial">Limited Free Trial</option>
            <option value="paid">Paid</option>
          </select>

          {/* Skill Level */}
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel | "")}
            className="px-3 py-1.5 rounded-lg bg-hub-surface border border-white/[0.1] text-white focus:outline-none focus:border-hub-gold"
          >
            <option value="">All Skill Levels</option>
            <option value="beginner">Beginner Friendly</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced Architecture</option>
          </select>

          {/* Toggle: No Credit Card */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-hub-text-secondary hover:text-white font-mono">
            <input
              type="checkbox"
              checked={noCreditCard}
              onChange={(e) => setNoCreditCard(e.target.checked)}
              className="rounded bg-hub-surface border-white/20 text-hub-gold focus:ring-0"
            />
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Card Required</span>
          </label>

          {/* Toggle: No API Key */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-hub-text-secondary hover:text-white font-mono">
            <input
              type="checkbox"
              checked={noApiKey}
              onChange={(e) => setNoApiKey(e.target.checked)}
              className="rounded bg-hub-surface border-white/20 text-hub-gold focus:ring-0"
            />
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>No API Key Required</span>
          </label>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-hub-gold hover:underline font-mono text-xs font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Count & Telemetry */}
      <div className="flex items-center justify-between text-xs text-hub-text-muted font-mono">
        <span>Showing {resources.length} verified developer resources</span>
        {loading && (
          <span className="flex items-center gap-1.5 text-hub-gold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Refreshing catalog...
          </span>
        )}
      </div>

      {/* Paywall Banner for Signed-Out Visitors */}
      {!loading && authStatus.state === "guest" && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-black/80 to-amber-950/60 border border-amber-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Guest Preview Mode</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Directory Tools Are Locked Behind Sign In
              </h3>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                You are currently browsing as a guest. All directory resources, verified quota limits, and direct access links are locked. Sign in or create a free account to unlock our verified developer catalog.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-gold-glow transition-all active:scale-95 uppercase tracking-wider"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Unlock</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95"
              >
                <span>Create Free Account</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Banner for Free Tier Users */}
      {!loading && authStatus.state === "authenticated" && !authStatus.isMember && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-black/70 border border-amber-500/30 p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Free Account Active
              </span>
              <p className="text-xs sm:text-sm text-hub-text-secondary">
                You have preview access to basic developer tools. Upgrade to Starter (KES 70), Basic, Pro, or VIP to unlock our entire 55+ enterprise tool catalog and unlimited blueprints.
              </p>
            </div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-gold-glow transition-all shrink-0 active:scale-95"
            >
              <span>View Plans from KES 70</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Resources Grid */}
      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onSelect={(r) => setSelectedResource(r)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4 rounded-2xl glass-panel p-8">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] mx-auto flex items-center justify-center text-hub-text-muted">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Matching Resources Found</h3>
          <p className="text-xs sm:text-sm text-hub-text-secondary max-w-sm mx-auto">
            Try adjusting your search query or resetting the pricing and requirement filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 shadow-gold-glow transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-hub-gold flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading directory...</span>
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}

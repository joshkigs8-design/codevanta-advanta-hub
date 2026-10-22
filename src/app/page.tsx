import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { Resource, Category, MembershipPlan } from "@/types";
import ResourceCard from "@/components/ResourceCard";
import {
  Compass,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Brain,
  Server,
  Lock,
  Code2,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();

  // Fetch featured resources
  const featuredRows = db
    .prepare(`
      SELECT r.*, c.name as category_name, c.slug as category_slug
      FROM resources r
      JOIN categories c ON r.category_id = c.id
      WHERE r.featured = 1 AND r.verification_status = 'verified'
      ORDER BY r.click_count DESC
      LIMIT 6
    `)
    .all() as unknown as Array<Record<string, any>>;

  const featuredResources: Resource[] = featuredRows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    short_description: r.short_description,
    detailed_description: r.detailed_description,
    official_website: r.official_website,
    documentation_url: r.documentation_url,
    category_id: r.category_id,
    category_name: r.category_name,
    category_slug: r.category_slug,
    pricing_classification: r.pricing_classification,
    free_tier_details: r.free_tier_details,
    api_key_required: Boolean(r.api_key_required),
    account_required: Boolean(r.account_required),
    credit_card_required: Boolean(r.credit_card_required),
    usage_limits: r.usage_limits,
    license_info: r.license_info,
    commercial_use_allowed: Boolean(r.commercial_use_allowed),
    skill_level: r.skill_level,
    platforms: JSON.parse(r.platforms || "[]"),
    programming_languages: JSON.parse(r.programming_languages || "[]"),
    alternatives: JSON.parse(r.alternatives || "[]"),
    last_verification_date: r.last_verification_date,
    verification_status: r.verification_status,
    editorial_notes: r.editorial_notes,
    featured: Boolean(r.featured),
    click_count: r.click_count,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  // Fetch categories
  const categories = db.prepare("SELECT * FROM categories ORDER BY display_order ASC LIMIT 8").all() as unknown as Category[];

  // Fetch membership plans
  const planRows = db.prepare("SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY price_kes ASC").all() as unknown as Array<MembershipPlan & { entitlements: string }>;
  const plans = planRows.map((p) => ({
    ...p,
    entitlements: JSON.parse(p.entitlements || "{}"),
  }));

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-hub-border/60">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-hub-forest/40 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-surface border border-hub-gold/30 text-xs font-mono text-hub-gold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>OPERATED BY CODEVANTA VENTURES • NAIROBI & GLOBAL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Discover Verified Free APIs, AI Models &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hub-gold via-yellow-200 to-hub-gold">
              Zero-Bill Developer Infrastructure
            </span>
          </h1>

          <p className="text-base sm:text-lg text-hub-text-secondary max-w-2xl mx-auto leading-relaxed">
            Stop losing hours hunting for working free tiers. We independently audit API rate limits,
            credit card mandates, student grants, and production starter kits.
          </p>

          {/* Quick Search Action */}
          <div className="max-w-xl mx-auto pt-4 flex flex-col sm:flex-row items-center gap-3">
            <form action="/directory" method="GET" className="relative w-full">
              <input
                type="text"
                name="q"
                placeholder="Search APIs, Gemini, Postgres, M-Pesa, Cloudflare..."
                className="w-full px-4 py-3.5 pl-11 rounded-xl bg-hub-surface border border-hub-border focus:border-hub-gold focus:outline-none text-sm text-hub-text-primary placeholder-hub-text-muted shadow-lg"
              />
              <Compass className="w-5 h-5 absolute left-3.5 top-3.5 text-hub-gold" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Quick Category Badges */}
          <div className="pt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-hub-text-muted">
            <span className="font-mono text-hub-text-secondary">Popular:</span>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/directory?category=${cat.slug}`}
                className="px-2.5 py-1 rounded-lg bg-hub-surface hover:bg-hub-surface-elevated border border-hub-border hover:border-hub-gold/40 text-hub-text-secondary hover:text-white transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-hub-surface-card border border-hub-border hover:border-hub-gold/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Independently Audited Quotas</h3>
            <p className="text-sm text-hub-text-secondary leading-relaxed">
              We test every entry. We distinguish real Free &amp; Open Source tools from sneakily metered free trials that demand a credit card upfront.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-hub-surface-card border border-hub-border hover:border-hub-gold/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-hub-forest text-hub-gold border border-hub-gold/30 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Full-Stack Blueprints</h3>
            <p className="text-sm text-hub-text-secondary leading-relaxed">
              Don’t start from blank files. VIP and Pro members get production starter kits with Next.js, M-Pesa webhooks, and AI pipelines ready to deploy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-hub-surface-card border border-hub-border hover:border-hub-gold/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Ethical, Non-Pyramid Referral</h3>
            <p className="text-sm text-hub-text-secondary leading-relaxed">
              Our referral programme is strictly direct-only, fully transparent, and audited against Kenyan consumer law. You never have to recruit anyone to use what you bought.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Resources Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hub-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-hub-gold font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Verified Directory Spotlight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Top Free Developer Utilities
            </h2>
          </div>

          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-hub-gold hover:text-hub-gold-hover transition-colors"
          >
            <span>Explore all 20+ resources</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>

      {/* Membership Plans Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-hub-gold font-bold">
            Affordable Access For Every Developer
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Transparent Membership Plans
          </h2>
          <p className="text-sm text-hub-text-secondary">
            Core resource exploration is always free. Upgrade for advanced architectural blueprints,
            unlimited bookmarks, and downloadable starter repos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {plans.map((plan) => {
            const isVip = plan.slug === "vip";
            const isPro = plan.slug === "pro";
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-hub-surface-card border transition-all ${
                  isVip
                    ? "border-hub-gold shadow-gold-glow"
                    : isPro
                    ? "border-emerald-600/60"
                    : "border-hub-border"
                }`}
              >
                {isVip && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-hub-gold text-hub-forest-dark text-[11px] font-extrabold tracking-wider uppercase font-mono shadow-md">
                    Most Comprehensive
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-hub-text-secondary mt-1 min-h-[36px]">{plan.description}</p>

                  <div className="my-6 p-4 rounded-xl bg-hub-surface border border-hub-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">KES {plan.price_kes}</span>
                      <span className="text-xs text-hub-text-muted uppercase font-mono">one-time</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-hub-border text-[11px] text-hub-text-secondary flex justify-between">
                      <span>Referral reward:</span>
                      <span className="font-mono text-emerald-400 font-semibold">KES {plan.direct_referral_reward_kes}</span>
                    </div>
                  </div>

                  {/* Entitlements list */}
                  <ul className="space-y-2.5 text-xs text-hub-text-secondary mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Access to verified public resource directory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_use_advanced_search ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_use_advanced_search ? "text-hub-text-primary" : "text-hub-text-muted"}>
                        Advanced multi-category filtering
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_access_learning_paths ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_access_learning_paths ? "text-hub-text-primary" : "text-hub-text-muted"}>
                        Curated learning roadmaps
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_access_original_blueprints ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_access_original_blueprints ? "text-hub-text-primary" : "text-hub-text-muted"}>
                        Original backend &amp; payment blueprints
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.entitlements.can_download_starter_kits ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className={plan.entitlements.can_download_starter_kits ? "text-hub-text-primary font-semibold text-hub-gold" : "text-hub-text-muted"}>
                        Downloadable production starter kits
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Up to {plan.entitlements.max_bookmarks} saved bookmarks</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href={`/plans?select=${plan.slug}`}
                  className={`w-full py-2.5 rounded-lg text-center font-semibold text-sm transition-all ${
                    isVip
                      ? "bg-hub-gold hover:bg-hub-gold-hover text-hub-forest-dark shadow-gold-glow"
                      : "bg-hub-surface hover:bg-hub-surface-elevated text-white border border-hub-border hover:border-hub-gold/40"
                  }`}
                >
                  Select {plan.name}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Anti-Pyramid & Legal Compliance Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-hub-surface border border-hub-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-hub-gold font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Consumer Protection &amp; Legal Governance</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Sustainable Platform Architecture
            </h3>
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              CodeVanta Advanta Hub is operated by <strong>CodeVanta Ventures</strong>. We never promise guaranteed returns
              or passive income. Referral rewards are funded entirely from direct product margins and are locked in compliance
              review until full legal sign-off.
            </p>
          </div>

          <Link
            href="/compliance"
            className="px-5 py-2.5 rounded-lg bg-hub-surface-elevated hover:bg-hub-forest text-sm font-semibold text-hub-text-primary border border-hub-border hover:border-hub-gold/50 transition-colors shrink-0"
          >
            Read Compliance Terms
          </Link>
        </div>
      </section>
    </div>
  );
}

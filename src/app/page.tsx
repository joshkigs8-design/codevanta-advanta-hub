import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { Resource, Category, MembershipPlan } from "@/types";
import ResourceCard from "@/components/ResourceCard";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Brain,
  Server,
  Lock,
  Code2,
  CheckCircle2,
  TrendingUp,
  Layers,
  Search,
  Check,
  Sparkles,
  Cpu,
  Terminal,
  Compass,
  Plus,
  Send,
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

  // Fetch membership plans
  const planRows = db
    .prepare("SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY price_kes ASC")
    .all() as unknown as Array<MembershipPlan & { entitlements: string }>;
  const plans = planRows.map((p) => ({
    ...p,
    entitlements: JSON.parse(p.entitlements || "{}"),
  }));

  return (
    <div className="space-y-24 pb-24">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION WITH BESPOKE ARCHITECTURAL VISUAL ART                     */}
      {/* ========================================================================= */}
      <section className="relative min-h-[94vh] flex flex-col justify-between overflow-hidden border-b border-white/10 pt-6 pb-12">
        {/* Bespoke Architectural Hero Background Illustration */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/hero-visual.svg"
            alt="Codevanta Monolithic Developer Pavilion at Twilight"
            className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05] animate-subtle-zoom"
          />
          {/* Multi-layered dark atmospheric overlays for crisp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-hub-bg via-hub-bg/60 to-black/55" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/25 to-hub-bg/85" />
        </div>

        {/* Hero Top Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 md:pt-10">
          {/* Signal Indicator Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 text-[11px] font-mono text-white/95 uppercase tracking-widest shadow-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Audited Developer Intelligence</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-2.5 text-xs font-mono text-white/90 bg-black/50 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/15 shadow-lg">
              <span className="text-hub-gold font-bold">30+</span>
              <span>Verified Free Tiers Online</span>
            </div>
          </div>

          {/* GIGANTIC MONUMENTAL BRAND DISPLAY (MATCHING MODO ARCHITECTURAL MASTHEAD) */}
          <div className="py-2 sm:py-6">
            <h1 className="text-[52px] sm:text-[96px] md:text-[144px] lg:text-[192px] font-black tracking-[-0.075em] text-white uppercase select-none leading-[0.84] drop-shadow-2xl font-sans">
              Codevanta<span className="text-hub-gold">.</span>
            </h1>
          </div>

          {/* Subheading, Description & Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-2 pb-6">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
                Modular developer infrastructure, tested free tiers, and production-ready blueprints.
              </p>
              <p className="text-sm sm:text-base text-hub-text-secondary max-w-xl leading-relaxed">
                Discover independently audited cloud APIs, database quotas, and production starter kits.
                Zero credit card surprises, zero hidden traps, built for engineers who ship.
              </p>

              {/* Call to Action Buttons */}
              <div className="pt-2 flex items-center gap-3.5 flex-wrap">
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-hub-gold hover:text-white transition-all shadow-xl active:scale-95 group"
                >
                  <span>Explore Directory</span>
                  <div className="w-6 h-6 rounded-full bg-black/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-black group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs sm:text-sm font-medium text-white/95 hover:text-white bg-black/55 hover:bg-black/80 backdrop-blur-xl border border-white/20 transition-all active:scale-95 shadow-lg"
                >
                  <Code2 className="w-4 h-4 text-hub-gold" />
                  <span>Production Starter Kits</span>
                </Link>
              </div>
            </div>

            {/* Quick Hero Search & Floating Tag */}
            <div className="lg:col-span-5 space-y-3">
              <div className="hidden lg:flex justify-end">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-white/80 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-white/15 shadow-lg">
                  <Layers className="w-3.5 h-3.5 text-hub-gold" />
                  <span>Modular Stacks for Any Scale</span>
                </div>
              </div>

              <form
                action="/directory"
                method="GET"
                className="p-2 sm:p-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl space-y-2"
              >
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-white/60" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search APIs, Auth, Databases, Next.js..."
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none focus:border-hub-gold transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover transition-colors shadow-md"
                  >
                    Search
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap px-1 text-[11px] text-white/70">
                  <span className="font-mono text-white/40">Quick:</span>
                  {["Gemini 2.0", "Supabase", "Cloudflare", "M-Pesa"].map((tag) => (
                    <Link
                      key={tag}
                      href={`/directory?q=${encodeURIComponent(tag)}`}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-white/85 hover:text-white transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* HERO BOTTOM: 4 FROSTED GLASS BENTO CARDS (DIRECT FROM REFERENCE DESIGN) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                icon: ShieldCheck,
                number: "01",
                title: "Audited Free Tiers",
                desc: "Every cloud API and database quota independently verified for real zero-card limits.",
                link: "/directory?pricing=free_and_open_source",
              },
              {
                icon: Code2,
                number: "02",
                title: "Turnkey Blueprints",
                desc: "Next.js 15 starter kits with Auth, SQLite, and M-Pesa ready to ship Day 1.",
                link: "/guides",
              },
              {
                icon: Brain,
                number: "03",
                title: "AI Models & Inference",
                desc: "Gemini 2.0, Groq LPUs, and OpenRouter integration specs for production apps.",
                link: "/directory?category=ai-apis-models",
              },
              {
                icon: Server,
                number: "04",
                title: "Edge Cloud & Scale",
                desc: "Supabase, Cloudflare Workers, and Neon Serverless Postgres architecture.",
                link: "/directory?category=databases-backends",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link
                  key={idx}
                  href={card.link}
                  className="group relative p-5 rounded-2xl glass-bento transition-all flex flex-col justify-between hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:text-hub-gold group-hover:scale-110 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-white/30 group-hover:text-hub-gold font-bold transition-colors">
                        {card.number}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-hub-gold transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-hub-text-secondary mt-1 leading-relaxed line-clamp-2">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-hub-gold text-white flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION: WHY DEVELOPERS CHOOSE CODEVANTA (3-COLUMN EDITORIAL BENTO)    */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Heading, Value proposition, and checklist */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-hub-gold font-bold block">
                01 / WHY DEVELOPERS CHOOSE CODEVANTA
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Engineered for Uncompromising Speed &amp; Truth
              </h2>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                We craft an independently audited index for modern developers. We test every API,
                isolate real Free Tiers from predatory trial funnels, and provide production-ready
                blueprints for immediate release.
              </p>

              {/* Checklist */}
              <div className="space-y-3 pt-2">
                {[
                  "Independently audited free quotas and rate limits",
                  "Zero credit card requirements upfront",
                  "100% direct-only ethical value model",
                  "Tested full-stack Next.js production starter kits",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-white/95">
                    <div className="w-4 h-4 rounded-full bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/compliance"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-xs font-semibold bg-white text-black hover:bg-hub-gold hover:text-white transition-all active:scale-95 group shadow-lg"
              >
                <span>Learn More About Compliance</span>
                <div className="w-5 h-5 rounded-full bg-black/10 group-hover:bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-black group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* Center Column: Big Feature Photography / Architecture Card */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl min-h-[380px] group">
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
              alt="High-performance developer workspace"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-6 inset-x-6 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-hub-gold font-bold bg-black/70 backdrop-blur-md px-3 py-1 rounded-md border border-white/15 inline-block">
                Production Benchmark
              </span>
              <h3 className="text-xl font-bold text-white leading-snug">
                Sub-100ms cold starts, zero-card free tiers, and 100% verified documentation.
              </h3>
            </div>
          </div>

          {/* Right Column: 3 Vertical Pillars */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3.5">
            {[
              {
                icon: Zap,
                title: "Turnkey Blueprints",
                desc: "Complete architectural starter repos ready for immediate git push.",
              },
              {
                icon: ShieldCheck,
                title: "Modern Stack Quality",
                desc: "Audited for Next.js 15, TypeScript, Tailwind, and Edge compatibility.",
              },
              {
                icon: TrendingUp,
                title: "Ethical & Direct-Only",
                desc: "Zero multi-tier recruitment or financial gimmicks. Strictly direct value.",
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/40 transition-colors flex-1 flex flex-col justify-center space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-hub-gold">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-white">{pillar.title}</h4>
                  <p className="text-xs text-hub-text-secondary leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: READY-TO-SHIP STACKS / CATALOG (3 LARGE CARDS + STATS PILL)   */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-hub-gold font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>02 / READY TO SHIP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Top Verified Developer Stacks &amp; Websites
            </h2>
          </div>

          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all group"
          >
            <span>Explore all 30+ resources</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 3 Featured Resource Picture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredResources.slice(0, 3).map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>

        {/* FULL-WIDTH DARK STATS PILL (DIRECT FROM SCREENSHOT STATS BAR) */}
        <div className="p-2 sm:p-3 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6">
            {[
              { value: "450+", label: "Verified public quotas", icon: ShieldCheck },
              { value: "17", label: "Developer disciplines & tags", icon: Layers },
              { value: "0", label: "Credit card traps tolerated", icon: Lock },
              { value: "5 min", label: "Average launch time", icon: Zap },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-hub-gold shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-[11px] text-hub-text-secondary uppercase tracking-wider font-mono">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: STEP-BY-STEP PROCESS JOURNEY (01 -> 06 ROADMAP)              */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-hub-gold font-bold block">
            03 / HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            The Smooth Pathway to Production
          </h2>
          <p className="text-xs sm:text-sm text-hub-text-secondary max-w-xl">
            A structured workflow to discover, integrate, and ship real products with zero initial capital spend.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 pt-2">
          {[
            {
              step: "01",
              title: "Discover & Filter",
              desc: "Locate APIs and tools matching your stack, language, and budget.",
            },
            {
              step: "02",
              title: "Verify Free Quotas",
              desc: "Review editorial rate limits and verify zero card requirement.",
            },
            {
              step: "03",
              title: "Clone Blueprint",
              desc: "Pull the full-stack starter repo configured with auth & schemas.",
            },
            {
              step: "04",
              title: "Connect Cloud APIs",
              desc: "Drop in your Gemini, Supabase, or Clerk environment keys.",
            },
            {
              step: "05",
              title: "Test Payments",
              desc: "Verify Safaricom Daraja or Paystack checkout webhooks locally.",
            },
            {
              step: "06",
              title: "Ship & Scale",
              desc: "Deploy instantly to Cloudflare Pages or Vercel edge infrastructure.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-hub-surface-card border border-white/10 hover:border-hub-gold/50 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-hub-gold">
                  {item.step}
                </span>
                {idx < 5 && (
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 hidden lg:block -mr-1" />
                )}
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-white">{item.title}</h4>
                <p className="text-[11px] text-hub-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION: DUAL LARGE SHOWCASE BANNERS (SPLIT CARDS FROM SCREENSHOT)     */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Banner 1: Full-Stack Starter Repos */}
          <div className="relative rounded-2xl overflow-hidden bg-hub-surface-card border border-white/10 shadow-2xl flex flex-col justify-between group">
            <div className="relative h-60 w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
                alt="Cloud server architecture"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-hub-surface-card via-hub-surface-card/40 to-transparent" />
            </div>

            <div className="p-6 sm:p-8 pt-3 flex flex-col justify-between flex-1 space-y-5">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-hub-gold font-bold">
                  PRODUCTION REPOSITORIES
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Full-Stack Starter Codebases
                </h3>
                <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                  Avoid reinventing auth flows, SQL schemas, and webhook verification. VIP members
                  receive complete codebases ready for deployment on Day 1.
                </p>

                <ul className="space-y-2.5 text-xs text-white/95 pt-1">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Next.js 15 App Router + Server Actions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Safaricom Daraja M-Pesa STK push &amp; IPN webhooks</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Embedded SQLite &amp; Supabase schema migrations</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-xs font-semibold bg-white text-black hover:bg-hub-gold hover:text-white transition-all active:scale-95 group shadow-md"
                >
                  <span>Explore Learning Guides</span>
                  <div className="w-5 h-5 rounded-full bg-black/10 group-hover:bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-black group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Banner 2: Transparent Membership Plans */}
          <div className="relative rounded-2xl overflow-hidden bg-hub-surface-card border border-white/10 shadow-2xl flex flex-col justify-between group">
            <div className="relative h-60 w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80"
                alt="Modern UI components and interfaces"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-hub-surface-card via-hub-surface-card/40 to-transparent" />
            </div>

            <div className="p-6 sm:p-8 pt-3 flex flex-col justify-between flex-1 space-y-5">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-hub-gold font-bold">
                  TRANSPARENT VALUE
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Membership Built for Independent Devs
                </h3>
                <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                  Basic directory browsing is 100% free forever. Upgrade for advanced architectural
                  guides, unlimited bookmarks, and starter kits starting at KES 150 one-time.
                </p>

                <ul className="space-y-2.5 text-xs text-white/95 pt-1">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Basic Tier: Public directory exploration</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pro Tier (KES 150): Curated roadmaps &amp; 50 bookmarks</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>VIP Tier (KES 350): Full starter kit downloads</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/plans"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-xs font-semibold bg-hub-gold text-white hover:bg-hub-gold-hover transition-all active:scale-95 group shadow-md"
                >
                  <span>Compare Membership Plans</span>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION: MEMBERSHIP PLANS COMPARISON                                  */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-hub-gold font-bold">
            SIMPLE, HONEST PRICING
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Transparent Membership Plans
          </h2>
          <p className="text-xs sm:text-sm text-hub-text-secondary">
            Core resource exploration is always free. Upgrade once for advanced architectural blueprints,
            unlimited bookmarks, and downloadable starter repos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
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
                    : "border-white/10"
                }`}
              >
                {isVip && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-hub-gold text-white text-[10px] font-extrabold tracking-wider uppercase font-mono shadow-md">
                    Most Comprehensive
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-hub-text-secondary mt-1 min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="my-6 p-4 rounded-xl bg-hub-surface border border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">KES {plan.price_kes}</span>
                      <span className="text-xs text-hub-text-muted uppercase font-mono">one-time</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-hub-text-secondary flex justify-between">
                      <span>Referral reward:</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        KES {plan.direct_referral_reward_kes}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-hub-text-secondary mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Access to verified public resource directory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          plan.entitlements.can_use_advanced_search
                            ? "text-emerald-400"
                            : "text-zinc-600"
                        }`}
                      />
                      <span
                        className={
                          plan.entitlements.can_use_advanced_search
                            ? "text-hub-text-primary"
                            : "text-hub-text-muted"
                        }
                      >
                        Advanced multi-category filtering
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          plan.entitlements.can_view_guides ? "text-emerald-400" : "text-zinc-600"
                        }`}
                      />
                      <span
                        className={
                          plan.entitlements.can_view_guides
                            ? "text-hub-text-primary"
                            : "text-hub-text-muted"
                        }
                      >
                        Curated learning roadmaps
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          plan.entitlements.can_view_blueprints
                            ? "text-emerald-400"
                            : "text-zinc-600"
                        }`}
                      />
                      <span
                        className={
                          plan.entitlements.can_view_blueprints
                            ? "text-hub-text-primary"
                            : "text-hub-text-muted"
                        }
                      >
                        Original backend &amp; payment blueprints
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          plan.entitlements.can_download_templates
                            ? "text-emerald-400"
                            : "text-zinc-600"
                        }`}
                      />
                      <span
                        className={
                          plan.entitlements.can_download_templates
                            ? "text-hub-text-primary font-semibold text-hub-gold"
                            : "text-hub-text-muted"
                        }
                      >
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
                  className={`w-full py-3 rounded-xl text-center font-semibold text-xs transition-all ${
                    isVip
                      ? "bg-hub-gold hover:bg-hub-gold-hover text-white shadow-gold-glow"
                      : isPro
                      ? "bg-white text-black hover:bg-hub-gold hover:text-white"
                      : "bg-hub-surface-elevated hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  Select {plan.name}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM LEAD / CONSULTATION FORM BANNER (MATCHING SCREENSHOT FORM)      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-black/75 border border-white/20 p-8 sm:p-12 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-hub-bg via-hub-bg/90 to-transparent" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-hub-gold font-bold">
                READY TO SHIP?
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                Get Personalized Stack Architecture &amp; Advisory
              </h2>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                Describe your project, and get curated recommendations of zero-cost verified APIs,
                database hosting, and Kenyan payment flows.
              </p>
            </div>

            {/* Interactive consultation lead form (matching MODO bottom lead form) */}
            <div className="lg:col-span-7">
              <form
                action="/register"
                method="GET"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2 bg-black/40 rounded-2xl border border-white/10"
              >
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/45 text-xs focus:outline-none focus:border-hub-gold transition-colors"
                />
                <input
                  type="email"
                  placeholder="Email or Phone"
                  required
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/45 text-xs focus:outline-none focus:border-hub-gold transition-colors"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-white text-black hover:bg-hub-gold hover:text-white transition-all shadow-xl active:scale-95 group"
                >
                  <span>Request Stack</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

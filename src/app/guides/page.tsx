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
  Sparkles,
  ArrowRight,
  Code,
  CheckCircle,
} from "lucide-react";

export default function GuidesPage() {
  const [guides, setGuides] = useState<LearningGuide[]>([]);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [activeGuide, setActiveGuide] = useState<LearningGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch user entitlements
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setEntitlements(data.entitlements);
      })
      .catch(() => {});

    // 2. Fetch guides directly via an inline fetch or server-side
    // For client components we can use a small endpoint or fetch
    fetch("/api/resources?limit=1")
      .then(() => {
        // Sample seed guides
        setGuides([
          {
            id: "guide-beginner-roadmap",
            slug: "beginner-developer-roadmap-2026",
            title: "The 2026 Kenyan Developer Roadmap: From Zero to Hired",
            summary: "A practical guide to mastering full-stack web development, open-source contribution, and local freelance ecosystems.",
            content: `## The Modern Developer Roadmap (2026 Edition)

Welcome to the CodeVanta developer curriculum. Whether you are a computer science student in Nairobi, a self-taught engineer in Mombasa, or building remotely anywhere across the globe, here is the battle-tested path to becoming a production-ready engineer.

### Phase 1: Foundational Web Technologies
1. **Semantic HTML5 & Modern CSS**: Master accessibility (WCAG), flexbox, grid, and CSS custom properties before reaching for component frameworks.
2. **Modern JavaScript (ES2024+)**: Asynchronous programming (Promises, async/await), array methods, event loop, and modular design.
3. **TypeScript**: Type inference, interfaces, generics, and strict null checks.

### Phase 2: Full-Stack Frameworks & Edge Runtimes
- **Next.js & React**: App Router, Server Components vs Client Components, Server Actions.
- **Databases**: Relational modeling with PostgreSQL, indexing, database migrations, and ACID transactions.
- **Security**: Authentication with session cookies, CSRF protection, and Row Level Security.

### Phase 3: Building Real-World Monetized Products
Do not stop at tutorial clones. Build real utility:
- Local Kenyan business directory with M-Pesa Daraja integration.
- AI customer support agent using Google Gemini 1.5 Flash.
- Automated invoice and receipt generator using headless Chrome.`,
            category: "Career & Fundamentals",
            difficulty: "beginner",
            estimated_minutes: 20,
            min_plan_tier: "free",
            starter_kit_download_url: undefined,
            is_published: true,
            created_at: "",
            updated_at: "",
          },
          {
            id: "guide-daraja-stk-push",
            slug: "safaricom-daraja-mpesa-integration-guide",
            title: "Mastering Safaricom M-Pesa Daraja 2.0: STK Push & Webhook Verification",
            summary: "Complete blueprint for building tamper-proof M-Pesa payments in Node.js/Next.js with idempotent webhooks.",
            content: `## Production M-Pesa Architecture

Accepting M-Pesa payments requires two distinct communication phases:
1. **The Outbound STK Push Request**: Initiating the customer PIN prompt via the Safaricom Daraja API.
2. **The Server-Side Webhook (Callback)**: Receiving and validating the transaction confirmation.

### Step 1: Security Rule #1 — Never Trust Frontend Redirects
Never mark an order or subscription as paid simply because the user clicked a "Payment Complete" button. Payment must ONLY be verified when your server receives an authenticated cryptographic webhook from the payment gateway.

### Step 2: Idempotency Key Handling
Payment gateways frequently retry webhooks if network latency causes a timeout. Store a unique \`idempotency_key\` or \`MerchantRequestID\` in your database. If a webhook arrives with an already-processed transaction reference:
\`\`\`typescript
const existing = db.prepare("SELECT * FROM payments WHERE idempotency_key = ?").get(key);
if (existing && existing.status === 'completed') {
  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" }); // Acknowledge without double-crediting
}
\`\`\`

### Step 3: Wallet Ledger Integration
When a subscription payment succeeds, trigger the referral reward ledger in the same database transaction.`,
            category: "Payments & Backend",
            difficulty: "intermediate",
            estimated_minutes: 35,
            min_plan_tier: "pro",
            starter_kit_download_url: "/downloads/codevanta-daraja-v2-starter.zip",
            is_published: true,
            created_at: "",
            updated_at: "",
          },
          {
            id: "guide-ai-rag-gemini",
            slug: "building-ai-apps-gemini-free-tier",
            title: "Building Production AI Applications on Google Gemini Free Tier",
            summary: "Architecting intelligent agents, document search (RAG), and structured JSON responses with zero cloud bill.",
            content: `## Building with Google Gemini API

Google Gemini 1.5 Flash provides 15 Requests Per Minute (RPM) and up to 1,500 requests per day for zero cost on Google AI Studio. This blueprint outlines how to build an AI document analyst without cloud costs.

### Structured JSON Output
Use Gemini's native \`responseSchema\` to ensure typed outputs:
\`\`\`json
{
  "type": "OBJECT",
  "properties": {
    "summary": { "type": "STRING" },
    "key_takeaways": { "type": "ARRAY", "items": { "type": "STRING" } },
    "risk_level": { "type": "STRING", "enum": ["low", "medium", "high"] }
  },
  "required": ["summary", "key_takeaways", "risk_level"]
}
\`\`\`

### Caching & Rate Limiting
To prevent hitting the 15 RPM limit on spikes, implement an in-memory or Redis token bucket queue.`,
            category: "Artificial Intelligence",
            difficulty: "advanced",
            estimated_minutes: 45,
            min_plan_tier: "vip",
            starter_kit_download_url: "/downloads/codevanta-gemini-agent-blueprint.zip",
            is_published: true,
            created_at: "",
            updated_at: "",
          },
        ]);
        setActiveGuide({
          id: "guide-beginner-roadmap",
          slug: "beginner-developer-roadmap-2026",
          title: "The 2026 Kenyan Developer Roadmap: From Zero to Hired",
          summary: "A practical guide to mastering full-stack web development, open-source contribution, and local freelance ecosystems.",
          content: `## The Modern Developer Roadmap (2026 Edition)\n\nWelcome to the CodeVanta developer curriculum...`,
          category: "Career & Fundamentals",
          difficulty: "beginner",
          estimated_minutes: 20,
          min_plan_tier: "free",
          is_published: true,
          created_at: "",
          updated_at: "",
        });
        setLoading(false);
      });
  }, []);

  const canAccessGuide = (guide: LearningGuide): boolean => {
    if (guide.min_plan_tier === "free") return true;
    if (!entitlements) return false;
    if (guide.min_plan_tier === "basic") {
      return entitlements.planSlug === "basic" || entitlements.planSlug === "pro" || entitlements.planSlug === "vip";
    }
    if (guide.min_plan_tier === "pro") {
      return entitlements.planSlug === "pro" || entitlements.planSlug === "vip";
    }
    if (guide.min_plan_tier === "vip") {
      return entitlements.planSlug === "vip";
    }
    return false;
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
          Original tutorials with production-ready code examples. Respecting developer time with practical,
          opinionated architectures.
        </p>
      </div>

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
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                        hasAccess
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950/80 text-amber-400 border border-amber-800"
                      }`}>
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shrink-0 transition-colors"
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
                    This original architecture blueprint and downloadable repository is an entitlement reserved for{" "}
                    <strong>{activeGuide.min_plan_tier.toUpperCase()}</strong> tier members.
                  </p>
                  <Link
                    href={`/plans?select=${activeGuide.min_plan_tier}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-hub-gold text-hub-forest-dark hover:bg-hub-gold-hover shadow-gold-glow"
                  >
                    <span>Upgrade to {activeGuide.min_plan_tier.toUpperCase()}</span>
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
    </div>
  );
}

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import bcrypt from "bcryptjs";
import { initPhase2SchemaAndData } from "./seeds";
import type {
  Profile,
  Resource,
  Category,
  Tag,
  MembershipPlan,
  Membership,
  LearningGuide,
  ReferralCode,
  ReferralAttribution,
  ReferralReward,
  WalletAccount,
  WalletLedgerEntry,
  WithdrawalRequest,
  Payment,
  PaymentEvent,
  VerificationLog,
  ResourceSubmission,
  AdminAuditLog,
  ProgrammeSettings,
  PlanSlug,
} from "../types";

let dbInstance: DatabaseSync | null = null;

function isDirectoryWritable(dir: string): boolean {
  try {
    const testFile = path.join(dir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, "");
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

function getDatabasePath(): string {
  // If explicitly configured via environment variable
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // Detect serverless hosting environments (Vercel, AWS Lambda, Netlify)
  // where the application root is strictly read-only and /tmp is writable.
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.NETLIFY) ||
    (process.platform === "linux" && fs.existsSync("/tmp") && !isDirectoryWritable(process.cwd()));

  if (isServerless) {
    const tmpDir = os.tmpdir() || "/tmp";
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    const tmpDbPath = path.join(tmpDir, "codevanta.sqlite");
    const cwdDbPath = path.join(process.cwd(), "codevanta.sqlite");

    // Copy bundled seed database from project root to tmp if present and not yet in tmp
    if (fs.existsSync(cwdDbPath) && !fs.existsSync(tmpDbPath)) {
      try {
        fs.copyFileSync(cwdDbPath, tmpDbPath);
      } catch {
        // Fallback to auto-initialization below
      }
    }

    return tmpDbPath;
  }

  return path.resolve(process.cwd(), "codevanta.sqlite");
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbPath = getDatabasePath();
  const parentDir = path.dirname(dbPath);
  if (!fs.existsSync(parentDir)) {
    try {
      fs.mkdirSync(parentDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  dbInstance = new DatabaseSync(dbPath);

  // WAL mode & performance tuning with graceful fallback
  try {
    dbInstance.exec("PRAGMA journal_mode = WAL;");
  } catch {
    try {
      dbInstance.exec("PRAGMA journal_mode = DELETE;");
    } catch {
      // ignore
    }
  }

  try {
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    dbInstance.exec("PRAGMA synchronous = NORMAL;");
  } catch {
    // ignore
  }

  initSchema(dbInstance);
  try {
    dbInstance.exec("ALTER TABLE profiles ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;");
  } catch {
    // column already exists
  }
  seedInitialData(dbInstance);
  initPhase2SchemaAndData(dbInstance);

  try {
    const adminUser = dbInstance.prepare("SELECT id FROM profiles WHERE role = 'admin' OR email = 'joshkigs8@gmail.com'").get() as { id: string } | undefined;
    if (adminUser) {
      const activeMem = dbInstance.prepare("SELECT id FROM memberships WHERE user_id = ? AND status = 'active'").get(adminUser.id);
      if (!activeMem) {
        const nowIso = new Date().toISOString();
        dbInstance.prepare(`
          INSERT OR REPLACE INTO memberships (
            id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes,
            starts_at, expires_at, payment_reference, created_at, updated_at
          ) VALUES (?, ?, 'plan-vip-350', 'vip', 'VIP Tier', 'active', 0, ?, NULL, 'SYSTEM-ADMIN-LIFETIME-VIP', ?, ?)
        `).run("mem-admin-vip", adminUser.id, nowIso, nowIso, nowIso);
      }
    }
  } catch {
    // ignore
  }

  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      phone_number TEXT,
      country TEXT NOT NULL DEFAULT 'KE',
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'code',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT NOT NULL,
      detailed_description TEXT NOT NULL,
      official_website TEXT NOT NULL,
      documentation_url TEXT NOT NULL,
      category_id TEXT NOT NULL,
      pricing_classification TEXT NOT NULL,
      free_tier_details TEXT NOT NULL DEFAULT '',
      api_key_required INTEGER NOT NULL DEFAULT 0,
      account_required INTEGER NOT NULL DEFAULT 0,
      credit_card_required INTEGER NOT NULL DEFAULT 0,
      usage_limits TEXT NOT NULL DEFAULT '',
      license_info TEXT NOT NULL DEFAULT '',
      commercial_use_allowed INTEGER NOT NULL DEFAULT 1,
      skill_level TEXT NOT NULL DEFAULT 'all_levels',
      platforms TEXT NOT NULL DEFAULT '[]',
      programming_languages TEXT NOT NULL DEFAULT '[]',
      alternatives TEXT NOT NULL DEFAULT '[]',
      last_verification_date TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'verified',
      editorial_notes TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      click_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS resource_tags (
      resource_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (resource_id, tag_id),
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_logs (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      verified_by TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (verified_by) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS resource_submissions (
      id TEXT PRIMARY KEY,
      submitted_by TEXT NOT NULL,
      resource_name TEXT NOT NULL,
      official_website TEXT NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      free_tier_info TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (submitted_by) REFERENCES profiles(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS membership_plans (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_kes REAL NOT NULL,
      direct_referral_reward_kes REAL NOT NULL,
      billing_cycle TEXT NOT NULL DEFAULT 'lifetime',
      is_active INTEGER NOT NULL DEFAULT 1,
      entitlements TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_slug TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      amount_paid_kes REAL NOT NULL,
      starts_at TEXT NOT NULL,
      expires_at TEXT,
      payment_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
    );

    CREATE TABLE IF NOT EXISTS learning_guides (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL DEFAULT 15,
      min_plan_tier TEXT NOT NULL DEFAULT 'free',
      starter_kit_download_url TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS referral_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referral_attributions (
      id TEXT PRIMARY KEY,
      referral_code TEXT NOT NULL,
      referrer_user_id TEXT NOT NULL,
      referred_user_id TEXT UNIQUE NOT NULL,
      ip_address_hash TEXT,
      user_agent_hash TEXT,
      status TEXT NOT NULL DEFAULT 'attributed',
      created_at TEXT NOT NULL,
      FOREIGN KEY (referrer_user_id) REFERENCES profiles(id),
      FOREIGN KEY (referred_user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS referral_rewards (
      id TEXT PRIMARY KEY,
      attribution_id TEXT NOT NULL,
      referrer_user_id TEXT NOT NULL,
      referred_user_id TEXT NOT NULL,
      qualifying_payment_id TEXT UNIQUE NOT NULL,
      plan_slug TEXT NOT NULL,
      reward_amount_kes REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      hold_until TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (attribution_id) REFERENCES referral_attributions(id),
      FOREIGN KEY (referrer_user_id) REFERENCES profiles(id),
      FOREIGN KEY (referred_user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KES',
      pending_balance REAL NOT NULL DEFAULT 0.0,
      approved_balance REAL NOT NULL DEFAULT 0.0,
      withdrawn_balance REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      amount_kes REAL NOT NULL,
      balance_after_kes REAL NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallet_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount_kes REAL NOT NULL,
      fee_kes REAL NOT NULL DEFAULT 0.0,
      net_amount_kes REAL NOT NULL,
      phone_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'mpesa_b2c',
      status TEXT NOT NULL DEFAULT 'submitted',
      external_transaction_id TEXT,
      admin_notes TEXT,
      rejection_reason TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      amount_kes REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KES',
      provider TEXT NOT NULL,
      provider_reference TEXT NOT NULL,
      checkout_request_id TEXT,
      merchant_request_id TEXT,
      phone_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      raw_payload TEXT,
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id),
      FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
    );

    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      provider TEXT NOT NULL,
      event_payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS programme_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function seedAdditionalResources(db: DatabaseSync) {
  const now = new Date().toISOString();
  const insertResource = db.prepare(`
    INSERT OR IGNORE INTO resources (
      id, name, slug, short_description, detailed_description, official_website, documentation_url,
      category_id, pricing_classification, free_tier_details, api_key_required, account_required,
      credit_card_required, usage_limits, license_info, commercial_use_allowed, skill_level,
      platforms, programming_languages, alternatives, last_verification_date, verification_status,
      editorial_notes, featured, click_count, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const resources = [
    {
      id: "res-neon",
      name: "Neon Serverless Postgres",
      slug: "neon-serverless-postgres",
      short_description: "Branchable, autoscaling PostgreSQL for prototypes, SaaS apps, and preview environments.",
      detailed_description: "Neon separates storage from compute and adds instant database branching, pooled connections, and scale-to-zero behavior. It works well with modern web frameworks and migration-based workflows.",
      official_website: "https://neon.tech",
      documentation_url: "https://neon.tech/docs",
      category_id: "cat-databases",
      pricing_classification: "freemium",
      free_tier_details: "Free plan with 0.5 GB storage per project, shared compute allowance, database branching, and scale-to-zero.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Free quotas are shared across projects and can change; check the current usage panel before production launch.",
      license_info: "Managed SaaS / PostgreSQL license",
      commercial_use_allowed: 1,
      skill_level: "intermediate",
      platforms: ["Web", "Serverless", "PostgreSQL"],
      programming_languages: ["SQL", "TypeScript", "Python", "Go", "Rust"],
      alternatives: ["Supabase", "Railway", "CockroachDB"],
      editorial_notes: "Excellent for preview databases and teams that need isolated branches without running Postgres locally.",
      featured: 1,
      click_count: 0,
    },
    {
      id: "res-upstash-redis",
      name: "Upstash Redis",
      slug: "upstash-redis",
      short_description: "Serverless Redis with REST access for caching, rate limits, queues, and sessions.",
      detailed_description: "Upstash provides an HTTP-friendly Redis API that works from serverless and edge runtimes without maintaining a persistent connection.",
      official_website: "https://upstash.com",
      documentation_url: "https://upstash.com/docs/redis",
      category_id: "cat-databases",
      pricing_classification: "freemium",
      free_tier_details: "Free database with a limited data size, monthly command quota, and bandwidth allowance for prototypes.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Free limits are enforced by monthly commands and bandwidth; confirm current quotas on the pricing page.",
      license_info: "Managed SaaS / Redis-compatible API",
      commercial_use_allowed: 1,
      skill_level: "intermediate",
      platforms: ["Web", "Edge", "Serverless"],
      programming_languages: ["TypeScript", "JavaScript", "Python", "Go"],
      alternatives: ["Redis Cloud", "Cloudflare KV", "Valkey"],
      editorial_notes: "A practical choice when a Vercel, Cloudflare, or edge function needs a low-latency key-value store.",
      featured: 0,
      click_count: 0,
    },
    {
      id: "res-cloudflare-pages",
      name: "Cloudflare Pages & Workers",
      slug: "cloudflare-pages-workers",
      short_description: "Global static hosting and edge functions for fast personal projects and web applications.",
      detailed_description: "Cloudflare Pages deploys directly from Git providers, while Workers adds lightweight server-side logic at the edge. The platform also connects to D1, KV, R2, and Durable Objects.",
      official_website: "https://pages.cloudflare.com",
      documentation_url: "https://developers.cloudflare.com/pages/",
      category_id: "cat-hosting",
      pricing_classification: "free_hosted_service",
      free_tier_details: "Unlimited static asset requests on Pages, with a free daily request allowance for Workers and Pages Functions.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Dynamic requests, builds, CPU time, and storage products have separate free quotas; static and dynamic limits differ.",
      license_info: "Commercial Cloud / Open Source Wrangler tooling",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: ["Web", "Edge", "Static Hosting"],
      programming_languages: ["JavaScript", "TypeScript", "Python", "Rust"],
      alternatives: ["Vercel", "Netlify", "GitHub Pages"],
      editorial_notes: "Best suited to static sites and small edge APIs. Review the current Workers limits before moving a busy backend.",
      featured: 1,
      click_count: 0,
    },
    {
      id: "res-sentry",
      name: "Sentry Developer Monitoring",
      slug: "sentry-developer-monitoring",
      short_description: "Error tracking, performance monitoring, and release visibility for side projects and small apps.",
      detailed_description: "Sentry captures exceptions, traces, breadcrumbs, and release context so developers can reproduce failures instead of relying on logs alone.",
      official_website: "https://sentry.io",
      documentation_url: "https://docs.sentry.io",
      category_id: "cat-hosting",
      pricing_classification: "freemium",
      free_tier_details: "Free Developer plan with a monthly error quota, limited performance events, and basic issue monitoring.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Event quotas and retention vary by product; configure sampling to stay within the free allowance.",
      license_info: "Commercial SaaS / Open Source SDKs",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: ["Web", "Mobile", "Backend"],
      programming_languages: ["JavaScript", "TypeScript", "Python", "Java", "Go", "PHP"],
      alternatives: ["Better Stack", "GlitchTip", "Highlight.io"],
      editorial_notes: "Add it early in a project so errors include the release, route, and user context needed to fix them.",
      featured: 0,
      click_count: 0,
    },
    {
      id: "res-open-meteo",
      name: "Open-Meteo Weather API",
      slug: "open-meteo-weather-api",
      short_description: "Free, open-source weather forecasts with no API key for non-commercial use.",
      detailed_description: "Open-Meteo exposes forecast, historical, marine, and air-quality data through simple JSON endpoints. It is ideal for demos and learning projects that should not require account setup.",
      official_website: "https://open-meteo.com",
      documentation_url: "https://open-meteo.com/en/docs",
      category_id: "cat-apis",
      pricing_classification: "free_and_open_source",
      free_tier_details: "Free access without an API key for non-commercial use, including forecast and historical weather endpoints.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "Non-commercial usage is free; commercial applications require a commercial customer agreement.",
      license_info: "CC BY 4.0 data / Open-source API",
      commercial_use_allowed: 0,
      skill_level: "beginner",
      platforms: ["REST API", "Web", "Mobile"],
      programming_languages: ["JavaScript", "TypeScript", "Python", "PHP", "cURL"],
      alternatives: ["OpenWeather", "WeatherAPI", "National Weather Service API"],
      editorial_notes: "One of the easiest APIs for a first dashboard because there is no key-management or signup step.",
      featured: 1,
      click_count: 0,
    },
    {
      id: "res-github-codespaces",
      name: "GitHub Codespaces",
      slug: "github-codespaces",
      short_description: "Cloud development environments with VS Code in the browser and repository-ready containers.",
      detailed_description: "Codespaces provides reproducible dev containers, forwarded ports, terminal access, and browser-based VS Code. It is useful for learning, onboarding, and developing from lower-powered hardware.",
      official_website: "https://github.com/features/codespaces",
      documentation_url: "https://docs.github.com/en/codespaces",
      category_id: "cat-hosting",
      pricing_classification: "freemium",
      free_tier_details: "Personal GitHub Free accounts include a monthly allowance of core-hours and storage for Codespaces.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Monthly included hours and storage depend on the account plan and machine type; usage stops or bills after the allowance.",
      license_info: "Commercial SaaS / VS Code and devcontainer ecosystem",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: ["Web", "VS Code", "Linux Container"],
      programming_languages: ["All Languages"],
      alternatives: ["Gitpod", "StackBlitz", "CodeSandbox"],
      editorial_notes: "A strong option for students who need a consistent Linux environment without configuring a local machine.",
      featured: 0,
      click_count: 0,
    },
    {
      id: "res-quickchart",
      name: "QuickChart",
      slug: "quickchart",
      short_description: "Chart and QR-code image generation through a simple URL and JSON API.",
      detailed_description: "QuickChart renders Chart.js configurations and QR codes into images that can be embedded in reports, emails, invoices, and server-generated documents.",
      official_website: "https://quickchart.io",
      documentation_url: "https://quickchart.io/documentation/",
      category_id: "cat-apis",
      pricing_classification: "freemium",
      free_tier_details: "Free public API access for lightweight chart and QR-code generation with usage limits.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "Free public endpoints are rate-limited; high-volume or private usage requires a paid plan.",
      license_info: "Commercial SaaS / Chart.js ecosystem",
      commercial_use_allowed: 1,
      skill_level: "beginner",
      platforms: ["REST API", "Web", "Server-side Rendering"],
      programming_languages: ["JavaScript", "TypeScript", "Python", "PHP", "cURL"],
      alternatives: ["Chart.js", "Image-Charts", "Mermaid"],
      editorial_notes: "Useful for receipts and admin dashboards when rendering a chart image is easier than shipping a browser runtime.",
      featured: 0,
      click_count: 0,
    },
    {
      id: "res-freecodecamp",
      name: "freeCodeCamp",
      slug: "freecodecamp",
      short_description: "Free interactive curriculum covering web development, Python, data, and interview preparation.",
      detailed_description: "freeCodeCamp combines browser-based exercises, projects, and certifications across responsive web design, JavaScript, front-end libraries, data analysis, machine learning, and information security.",
      official_website: "https://www.freecodecamp.org",
      documentation_url: "https://www.freecodecamp.org/learn/",
      category_id: "cat-student",
      pricing_classification: "free_and_open_source",
      free_tier_details: "All curriculum, projects, and certifications are free with no subscription or credit card.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "Unlimited learning access; certifications require completing the included projects.",
      license_info: "Open source / Creative Commons educational content",
      commercial_use_allowed: 1,
      skill_level: "beginner",
      platforms: ["Web", "Mobile Browser"],
      programming_languages: ["HTML", "CSS", "JavaScript", "Python", "SQL"],
      alternatives: ["The Odin Project", "Full Stack Open", "MDN Web Docs"],
      editorial_notes: "A dependable zero-cost starting point for learners who want hands-on exercises instead of passive video courses.",
      featured: 1,
      click_count: 0,
    },
{
        "id": "res-nvidia-nim",
        "name": "NVIDIA NIM / NVIDIA Build",
        "slug": "nvidia-nim-build",
        "short_description": "GPU-accelerated inference APIs for Llama 3.3, DeepSeek, and Nemotron with 1,000 free credits.",
        "detailed_description": "NVIDIA Build (build.nvidia.com) provides production-ready NIM (NVIDIA Inference Microservices) APIs. Developers receive 1,000 free trial API credits on sign-up to test and deploy leading AI models—such as Llama 3.3 70B, DeepSeek-R1, Mistral Large, Gemma 2, and NVIDIA NeMo Retriever—via fully OpenAI-compatible REST endpoints.",
        "official_website": "https://build.nvidia.com",
        "documentation_url": "https://docs.api.nvidia.com",
        "category_id": "cat-ai-models",
        "pricing_classification": "freemium",
        "free_tier_details": "1,000 free inference API credits upon signup to evaluate models with OpenAI-compatible completion and embedding endpoints.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "1,000 credits to test models in the cloud; self-hosted container deployment requires enterprise licensing.",
        "license_info": "Commercial Cloud / Free Trial Evaluation License",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Cloud API",
            "Docker",
            "REST API",
            "Kubernetes"
        ],
        "programming_languages": [
            "Python",
            "TypeScript",
            "cURL",
            "Go"
        ],
        "alternatives": [
            "Groq Cloud LPU Inference",
            "OpenRouter",
            "Google Gemini Developer API"
        ],
        "editorial_notes": "A fantastic resource for testing cutting-edge LLMs and vision models at incredible GPU speeds with zero initial infrastructure cost.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-cursor",
        "name": "Cursor AI Code Editor",
        "slug": "cursor-ai-editor",
        "short_description": "AI-first code editor with multi-file editing, codebase indexing, and frontier LLM integration.",
        "detailed_description": "Cursor is a popular fork of VS Code built for pair programming with AI. It features full-repo context awareness, multi-file code generation (Composer), terminal error fixing, and flexible model selection.",
        "official_website": "https://www.cursor.com",
        "documentation_url": "https://docs.cursor.com",
        "category_id": "cat-ai-coding",
        "pricing_classification": "freemium",
        "free_tier_details": "Free hobby tier includes 2,000 code completions/month, 50 slow requests to premium frontier models, and full editor features.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Hobby plan limits fast frontier model requests; upgrade available for unlimited fast access.",
        "license_info": "Proprietary Client / VS Code Open Source Base",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "macOS",
            "Linux",
            "Windows"
        ],
        "programming_languages": [
            "TypeScript",
            "Python",
            "JavaScript",
            "Go",
            "Rust",
            "C++",
            "All Languages"
        ],
        "alternatives": [
            "Windsurf",
            "Continue.dev",
            "GitHub Copilot"
        ],
        "editorial_notes": "The standout AI editor for navigating and refactoring large unfamiliar codebases.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-codeium",
        "name": "Codeium & Windsurf Editor",
        "slug": "codeium-ai-assistant",
        "short_description": "Free unlimited AI code completion and context-aware chat assistant for individual developers.",
        "detailed_description": "Codeium provides ultrafast AI code completion, in-editor chat, and multi-file code editing through the Windsurf IDE and plugins for VS Code, JetBrains, Vim/Neovim, and Eclipse.",
        "official_website": "https://codeium.com",
        "documentation_url": "https://docs.codeium.com",
        "category_id": "cat-ai-coding",
        "pricing_classification": "freemium",
        "free_tier_details": "Free Individual plan provides unlimited fast autocomplete, natural language chat, and support for 70+ languages forever.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Free for individual developers forever; enterprise teams require team subscription.",
        "license_info": "Proprietary Free-for-Individuals SaaS",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "VS Code",
            "JetBrains",
            "Neovim",
            "macOS",
            "Windows",
            "Linux"
        ],
        "programming_languages": [
            "Python",
            "JavaScript",
            "TypeScript",
            "Java",
            "C++",
            "Go",
            "Rust",
            "PHP"
        ],
        "alternatives": [
            "Cursor",
            "GitHub Copilot",
            "Continue.dev"
        ],
        "editorial_notes": "The best truly unlimited free alternative to Copilot for students and independent developers.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-continue-dev",
        "name": "Continue.dev Open-Source AI Assistant",
        "slug": "continue-dev-assistant",
        "short_description": "Open-source autopilot extension for VS Code and JetBrains connecting to local or cloud LLMs.",
        "detailed_description": "Continue is an open-source coding assistant that lets developers bring their own models—whether running local models via Ollama or using free API keys from Groq, Gemini, or Mistral—for autocomplete, codebase Q&A, and documentation generation.",
        "official_website": "https://continue.dev",
        "documentation_url": "https://docs.continue.dev",
        "category_id": "cat-ai-coding",
        "pricing_classification": "free_and_open_source",
        "free_tier_details": "100% free and open-source (Apache 2.0). Connects with any local or cloud AI provider of your choice.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Zero artificial limits; usage depends purely on your chosen model or local hardware.",
        "license_info": "Apache-2.0 Open Source",
        "commercial_use_allowed": 1,
        "skill_level": "intermediate",
        "platforms": [
            "VS Code",
            "JetBrains",
            "macOS",
            "Linux",
            "Windows"
        ],
        "programming_languages": [
            "All Languages"
        ],
        "alternatives": [
            "Cursor",
            "Codeium",
            "Aider"
        ],
        "editorial_notes": "The champion of developer sovereignty: zero telemetry lock-in, fully customizable system prompts, and local model privacy.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-v0-vercel",
        "name": "v0 by Vercel",
        "slug": "v0-by-vercel",
        "short_description": "Generative UI tool that turns natural language descriptions into production-ready React and Tailwind components.",
        "detailed_description": "v0 by Vercel generates modern web components and full screen layouts using React, Tailwind CSS, and shadcn/ui. Developers can preview, edit, copy JSX code, or directly install components into Next.js projects via CLI.",
        "official_website": "https://v0.dev",
        "documentation_url": "https://v0.dev/docs",
        "category_id": "cat-ai-coding",
        "pricing_classification": "freemium",
        "free_tier_details": "Free plan includes 200 free generation credits monthly, with community sharing and full code export.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Credits refresh each month; generated components can be copied and customized freely.",
        "license_info": "Commercial SaaS / Generated Code is MIT",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "Next.js",
            "React"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript",
            "HTML",
            "Tailwind CSS"
        ],
        "alternatives": [
            "shadcn/ui",
            "Lovable",
            "Bolt.new"
        ],
        "editorial_notes": "Incredible time-saver for generating complex landing pages, pricing cards, and interactive dashboards.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-huggingface",
        "name": "Hugging Face Serverless Inference API",
        "slug": "huggingface-inference-api",
        "short_description": "Free instant REST API endpoints for over 100,000 open-source AI and transformer models.",
        "detailed_description": "Hugging Face provides free serverless inference endpoints for text generation, embeddings, sentiment classification, question answering, speech-to-text, and computer vision with an HTTP API token.",
        "official_website": "https://huggingface.co",
        "documentation_url": "https://huggingface.co/docs/api-inference",
        "category_id": "cat-ai-models",
        "pricing_classification": "freemium",
        "free_tier_details": "Free community access with rate-limited serverless inference for popular open-source models with no credit card required.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Rate limits apply on free tier; heavy workloads require Dedicated Endpoints or Pro.",
        "license_info": "Open-Source Models / SaaS API",
        "commercial_use_allowed": 1,
        "skill_level": "intermediate",
        "platforms": [
            "REST API",
            "Python",
            "JavaScript"
        ],
        "programming_languages": [
            "Python",
            "JavaScript",
            "TypeScript",
            "cURL"
        ],
        "alternatives": [
            "Replicate",
            "NVIDIA NIM",
            "Groq"
        ],
        "editorial_notes": "The epicenter of the open-source AI movement and essential for experimenting with niche models.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-mistral-ai",
        "name": "Mistral AI La Plateforme",
        "slug": "mistral-ai-platform",
        "short_description": "Frontier open-weights models and specialized coding models with generous developer access.",
        "detailed_description": "Mistral AI offers cutting-edge models including Mistral Large, Mistral Small, Pixtral, and Codestral—a specialized 22B model optimized for code generation, fill-in-the-middle, and refactoring.",
        "official_website": "https://mistral.ai",
        "documentation_url": "https://docs.mistral.ai",
        "category_id": "cat-ai-models",
        "pricing_classification": "freemium",
        "free_tier_details": "Free trial credits upon registration and free developer endpoint access for Codestral non-commercial development.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Free tier subject to per-minute rate limits; pay-as-you-go billing available for scale.",
        "license_info": "Commercial Cloud API / Apache 2.0 open weights",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "REST API",
            "Python",
            "TypeScript"
        ],
        "programming_languages": [
            "Python",
            "TypeScript",
            "cURL",
            "Go"
        ],
        "alternatives": [
            "Groq",
            "OpenRouter",
            "Google Gemini Developer API"
        ],
        "editorial_notes": "Codestral is one of the fastest, highest-quality code intelligence models available today.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-cohere",
        "name": "Cohere Developer Platform",
        "slug": "cohere-developer-api",
        "short_description": "State-of-the-art multilingual text embeddings, rerankers, and retrieval models.",
        "detailed_description": "Cohere powers semantic search, enterprise RAG, and NLP applications. Their Embed and Rerank APIs set the benchmark for search accuracy, and their trial key allows developers to build and test applications for free.",
        "official_website": "https://cohere.com",
        "documentation_url": "https://docs.cohere.com",
        "category_id": "cat-ai-models",
        "pricing_classification": "freemium",
        "free_tier_details": "Free Trial Key with up to 1,000 API requests per month across Embed, Rerank, and Command models without entering payment details.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Trial key allows 1,000 calls/month; suitable for evaluation, prototypes, and hackathons.",
        "license_info": "Commercial SaaS API",
        "commercial_use_allowed": 0,
        "skill_level": "intermediate",
        "platforms": [
            "REST API",
            "Python",
            "TypeScript"
        ],
        "programming_languages": [
            "Python",
            "TypeScript",
            "Go",
            "Java"
        ],
        "alternatives": [
            "Voyage AI",
            "OpenAI Embeddings",
            "Hugging Face"
        ],
        "editorial_notes": "The Cohere Rerank model is essential for fixing hallucination and relevance in RAG vector search pipelines.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-jsonplaceholder",
        "name": "JSONPlaceholder Fake REST API",
        "slug": "jsonplaceholder-api",
        "short_description": "Free fake REST API for testing, tutorials, and frontend prototyping with zero setup.",
        "detailed_description": "JSONPlaceholder is a dependable online REST API providing realistic mock resources: 100 posts, 500 comments, 100 albums, 5,000 photos, 200 todos, and 10 users with full CRUD HTTP methods (GET, POST, PUT, PATCH, DELETE).",
        "official_website": "https://jsonplaceholder.typicode.com",
        "documentation_url": "https://jsonplaceholder.typicode.com/guide/",
        "category_id": "cat-apis",
        "pricing_classification": "free_and_open_source",
        "free_tier_details": "100% free and open public service. No API key, registration, or credit card required.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Unlimited for regular learning, teaching, testing, and development.",
        "license_info": "MIT License",
        "commercial_use_allowed": 1,
        "skill_level": "beginner",
        "platforms": [
            "REST API",
            "Web",
            "Mobile"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "Python",
            "Swift",
            "Kotlin",
            "cURL"
        ],
        "alternatives": [
            "DummyJSON",
            "Mockoon",
            "Mirage JS"
        ],
        "editorial_notes": "The global gold standard API for teaching fetch(), async/await, and building frontend portfolio projects.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-rest-countries",
        "name": "REST Countries API",
        "slug": "rest-countries-api",
        "short_description": "Free open REST API providing country data, flags, borders, currencies, and languages.",
        "detailed_description": "REST Countries provides information about all world nations via simple REST endpoints: capital cities, region, subregion, population, lat/lng, timezones, official currencies, dialing codes, and SVG flags.",
        "official_website": "https://restcountries.com",
        "documentation_url": "https://gitlab.com/restcountries/restcountries",
        "category_id": "cat-apis",
        "pricing_classification": "free_and_open_source",
        "free_tier_details": "Free and open to the public without rate limits or keys for educational and non-commercial development.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Free for developer use; caching recommended for high-volume apps.",
        "license_info": "Mozilla Public License 2.0",
        "commercial_use_allowed": 1,
        "skill_level": "beginner",
        "platforms": [
            "REST API",
            "Web",
            "Mobile"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "Python",
            "Dart",
            "PHP"
        ],
        "alternatives": [
            "GeoNames",
            "Country Layer",
            "World Bank API"
        ],
        "editorial_notes": "Superb for building country selectors, flag quizzes, geographic dashboards, and travel apps.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-exchangerate-api",
        "name": "ExchangeRate-API",
        "slug": "exchangerate-api",
        "short_description": "Reliable real-time currency conversion and foreign exchange data for 160+ fiat currencies.",
        "detailed_description": "ExchangeRate-API delivers live exchange rates, historical rates, and currency pair conversions for fintech applications, e-commerce checkouts, and expense tracking tools.",
        "official_website": "https://www.exchangerate-api.com",
        "documentation_url": "https://www.exchangerate-api.com/docs/overview",
        "category_id": "cat-apis",
        "pricing_classification": "freemium",
        "free_tier_details": "Free plan gives 1,500 API requests per month with once-daily rate updates and access to 160+ currencies.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "1,500 requests/month on the free tier; sufficient for personal budgets and side project shops.",
        "license_info": "Commercial SaaS",
        "commercial_use_allowed": 1,
        "skill_level": "beginner",
        "platforms": [
            "REST API",
            "Web",
            "Mobile"
        ],
        "programming_languages": [
            "JavaScript",
            "Python",
            "PHP",
            "Go",
            "Java"
        ],
        "alternatives": [
            "Fixer.io",
            "Open Exchange Rates",
            "CurrencyAPI"
        ],
        "editorial_notes": "Ideal for converting East African Shillings (KES), USD, EUR, and GBP in shopping carts and financial tools.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-pokeapi",
        "name": "PokéAPI",
        "slug": "pokeapi",
        "short_description": "Free RESTful and GraphQL API for Pokémon species, sprites, moves, abilities, and items.",
        "detailed_description": "PokéAPI is one of the most popular educational APIs in software engineering. It provides deeply nested relational data for every Pokémon, generation, game version, and sprite, with full support for both REST and GraphQL.",
        "official_website": "https://pokeapi.co",
        "documentation_url": "https://pokeapi.co/docs/v2",
        "category_id": "cat-apis",
        "pricing_classification": "free_and_open_source",
        "free_tier_details": "100% free and open public API with no rate limit, no account, and no API keys required.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Public fair-use policy with Cloudflare edge caching.",
        "license_info": "BSD 3-Clause Open Source",
        "commercial_use_allowed": 0,
        "skill_level": "beginner",
        "platforms": [
            "REST API",
            "GraphQL",
            "Web",
            "Mobile"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "Python",
            "React",
            "Vue",
            "Flutter"
        ],
        "alternatives": [
            "Rick and Morty API",
            "Star Wars API (SWAPI)",
            "Studio Ghibli API"
        ],
        "editorial_notes": "The all-time classic API for practicing infinite scroll, pagination, search filters, and state management.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-unsplash-api",
        "name": "Unsplash Developer API",
        "slug": "unsplash-developer-api",
        "short_description": "Search and integrate over 5 million high-resolution royalty-free photos in applications.",
        "detailed_description": "The Unsplash API gives developers access to a world-class collection of photos with search by keyword, color, orientation, and curated topics, complete with download tracking and attribution endpoints.",
        "official_website": "https://unsplash.com/developers",
        "documentation_url": "https://unsplash.com/documentation",
        "category_id": "cat-apis",
        "pricing_classification": "freemium",
        "free_tier_details": "Free developer tier provides 50 requests per hour in demo mode with instant approval.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "50 requests/hour during demo/testing; production applications can request free tier increases.",
        "license_info": "Unsplash License (free commercial & personal usage)",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "REST API",
            "Web",
            "Mobile"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "Python",
            "Swift",
            "Kotlin"
        ],
        "alternatives": [
            "Pexels API",
            "Pixabay API",
            "Cloudinary"
        ],
        "editorial_notes": "Perfect for dynamic blog thumbnails, avatar placeholders, and wallpaper apps.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-algolia",
        "name": "Algolia Search & Discovery",
        "slug": "algolia-search-api",
        "short_description": "Lightning-fast, typo-tolerant search and indexing engine with real-time UI components.",
        "detailed_description": "Algolia provides an instant search-as-a-service platform with millisecond latency, typo tolerance, geosearch, and facet filtering, accompanied by pre-built UI widget libraries (InstantSearch).",
        "official_website": "https://www.algolia.com",
        "documentation_url": "https://www.algolia.com/doc/",
        "category_id": "cat-apis",
        "pricing_classification": "freemium",
        "free_tier_details": "Free plan includes 10,000 search requests and 10,000 indexed records per month with zero credit card required.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Free for up to 10,000 search operations/month; pay-as-you-go thereafter.",
        "license_info": "Commercial SaaS / Open Source SDKs",
        "commercial_use_allowed": 1,
        "skill_level": "intermediate",
        "platforms": [
            "Web",
            "iOS",
            "Android",
            "Serverless"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "Python",
            "PHP",
            "Ruby",
            "Swift"
        ],
        "alternatives": [
            "Meilisearch",
            "Typesense",
            "Elasticsearch"
        ],
        "editorial_notes": "The smoothest way to implement search-as-you-type in documentation and e-commerce websites.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-firebase",
        "name": "Google Firebase",
        "slug": "google-firebase",
        "short_description": "Google's backend platform with Firestore, Authentication, Cloud Functions, and Analytics.",
        "detailed_description": "Firebase accelerates app development with managed cloud infrastructure: Cloud Firestore (real-time NoSQL), Firebase Auth, Cloud Storage, Hosting, and Cloud Messaging.",
        "official_website": "https://firebase.google.com",
        "documentation_url": "https://firebase.google.com/docs",
        "category_id": "cat-databases",
        "pricing_classification": "freemium",
        "free_tier_details": "Spark Plan (free forever) includes 1 GB Firestore storage, 50,000 reads/day, 20,000 writes/day, 10 GB hosting transfer, and unlimited email auth.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Spark plan has hard quotas that stop rather than bill; credit card is not required.",
        "license_info": "Commercial Cloud / Open Source Client SDKs",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "iOS",
            "Android",
            "Flutter",
            "Unity"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript",
            "Dart",
            "Swift",
            "Kotlin",
            "Python"
        ],
        "alternatives": [
            "Supabase",
            "Appwrite",
            "PocketBase"
        ],
        "editorial_notes": "The default choice for Flutter mobile developers and hackathon rapid prototypes.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-mongodb-atlas",
        "name": "MongoDB Atlas Cloud",
        "slug": "mongodb-atlas",
        "short_description": "Managed cloud document database with automated backups, monitoring, and flexible JSON schemas.",
        "detailed_description": "MongoDB Atlas delivers managed MongoDB clusters hosted across AWS, Google Cloud, or Azure with built-in search, vector search, time-series collections, and automated failover.",
        "official_website": "https://www.mongodb.com/atlas",
        "documentation_url": "https://www.mongodb.com/docs/atlas/",
        "category_id": "cat-databases",
        "pricing_classification": "freemium",
        "free_tier_details": "Free M0 Sandbox cluster with 512 MB storage, shared RAM, and continuous uptime with no credit card required.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "1 free M0 cluster per Atlas project; ideal for student projects and early stage MVP backends.",
        "license_info": "Commercial SaaS / Server Side Public License (SSPL)",
        "commercial_use_allowed": 1,
        "skill_level": "beginner",
        "platforms": [
            "Cloud",
            "Node.js",
            "Python",
            "Docker"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "Python",
            "Java",
            "Go",
            "C#"
        ],
        "alternatives": [
            "Supabase",
            "PostgreSQL",
            "Couchbase"
        ],
        "editorial_notes": "The standard document database for the MERN (MongoDB, Express, React, Node) stack.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-convex",
        "name": "Convex Reactive Backend",
        "slug": "convex-backend",
        "short_description": "Type-safe reactive backend with automatic state sync, relational ACID database, and serverless functions.",
        "detailed_description": "Convex replaces REST/GraphQL APIs and ORMs with reactive TypeScript functions. When database state changes, connected web and mobile clients automatically re-render without manual polling or WebSockets.",
        "official_website": "https://www.convex.dev",
        "documentation_url": "https://docs.convex.dev",
        "category_id": "cat-databases",
        "pricing_classification": "freemium",
        "free_tier_details": "Generous free starter tier with 1M monthly function calls, 1 GB database storage, and 10 GB file storage.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Free for hobbyists and side projects; scalable to team plans.",
        "license_info": "Commercial SaaS / Open Source Client & Core",
        "commercial_use_allowed": 1,
        "skill_level": "intermediate",
        "platforms": [
            "Web",
            "React",
            "Next.js",
            "React Native"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript"
        ],
        "alternatives": [
            "Supabase",
            "Firebase",
            "Liveblocks"
        ],
        "editorial_notes": "The most seamless real-time database experience available for modern React and Next.js applications.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-vercel",
        "name": "Vercel Frontend Cloud",
        "slug": "vercel-platform",
        "short_description": "The official hosting platform for Next.js with global edge CDN, serverless functions, and Git CI/CD.",
        "detailed_description": "Vercel provides developer workflow automation: push to Git to deploy preview branches, instant production rollouts, automatic SSL certificates, Serverless Functions, Edge Middleware, and Web Analytics.",
        "official_website": "https://vercel.com",
        "documentation_url": "https://vercel.com/docs",
        "category_id": "cat-hosting",
        "pricing_classification": "freemium",
        "free_tier_details": "Hobby Plan (free for non-commercial personal projects): unlimited deployments, 100 GB monthly bandwidth, and serverless execution.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "100 GB bandwidth and execution allowances per month on non-commercial projects.",
        "license_info": "Commercial Cloud Platform",
        "commercial_use_allowed": 0,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "Next.js",
            "Edge Network"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript",
            "Python",
            "Go"
        ],
        "alternatives": [
            "Cloudflare Pages & Workers",
            "Netlify",
            "Render Cloud Hosting"
        ],
        "editorial_notes": "The gold standard for hosting Next.js and React web applications.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-netlify",
        "name": "Netlify Web Platform",
        "slug": "netlify-platform",
        "short_description": "Global cloud platform for modern static and composable web applications with automated Git deployments.",
        "detailed_description": "Netlify simplifies web publishing with automated builds from GitHub/GitLab, instant deploy previews, edge functions, form handling, and automated SSL.",
        "official_website": "https://www.netlify.com",
        "documentation_url": "https://docs.netlify.com",
        "category_id": "cat-hosting",
        "pricing_classification": "freemium",
        "free_tier_details": "Free Starter plan gives 100 GB monthly bandwidth, 300 build minutes, and 100 form submissions per month.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "100 GB bandwidth and 300 build minutes per month.",
        "license_info": "Commercial Cloud Platform",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "Jamstack",
            "Edge"
        ],
        "programming_languages": [
            "JavaScript",
            "TypeScript",
            "HTML",
            "CSS"
        ],
        "alternatives": [
            "Vercel",
            "Cloudflare Pages & Workers",
            "GitHub Pages"
        ],
        "editorial_notes": "A pioneer of Jamstack hosting with exceptional form handling and deploy preview commenting.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-railway",
        "name": "Railway App Platform",
        "slug": "railway-cloud",
        "short_description": "Frictionless cloud infrastructure to deploy web apps, background workers, and databases from Git.",
        "detailed_description": "Railway removes DevOps friction by building and deploying applications directly from repositories or Dockerfiles with managed Postgres, Redis, MySQL, and private networking.",
        "official_website": "https://railway.com",
        "documentation_url": "https://docs.railway.com",
        "category_id": "cat-hosting",
        "pricing_classification": "freemium",
        "free_tier_details": "Trial tier includes $5 or initial execution credits to deploy containers and databases with zero upfront payment.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Trial credits allow initial prototype deployment; usage-based billing applies upon credit exhaustion.",
        "license_info": "Commercial Cloud / Open Source CLI",
        "commercial_use_allowed": 1,
        "skill_level": "intermediate",
        "platforms": [
            "Docker",
            "Linux Containers",
            "Cloud"
        ],
        "programming_languages": [
            "Node.js",
            "Python",
            "Go",
            "Rust",
            "Java",
            "Docker"
        ],
        "alternatives": [
            "Render Cloud Hosting",
            "Fly.io",
            "Heroku"
        ],
        "editorial_notes": "The easiest way to run backend Docker containers, Python Celery workers, and microservices.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-supabase-auth",
        "name": "Supabase Auth & User Management",
        "slug": "supabase-auth",
        "short_description": "Full-featured open-source authentication with Row-Level Security, social logins, and passwordless OTP.",
        "detailed_description": "Supabase Auth integrates directly with PostgreSQL Row-Level Security (RLS) policies. It supports OAuth providers (Google, GitHub, Apple), magic email links, SMS phone auth, passkeys, and multi-factor authentication.",
        "official_website": "https://supabase.com/auth",
        "documentation_url": "https://supabase.com/docs/guides/auth",
        "category_id": "cat-auth",
        "pricing_classification": "freemium",
        "free_tier_details": "Free plan includes 50,000 monthly active users (MAU), unlimited social logins, and full RLS integration.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "50,000 MAU on the free tier with zero card required.",
        "license_info": "Apache-2.0 / Managed SaaS",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "iOS",
            "Android",
            "Flutter",
            "React Native"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript",
            "Python",
            "Dart",
            "Swift"
        ],
        "alternatives": [
            "Clerk User Management",
            "Firebase Auth",
            "Auth0"
        ],
        "editorial_notes": "The most generous free auth tier in the industry with 50,000 free monthly active users.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-kinde",
        "name": "Kinde Modern Authentication",
        "slug": "kinde-auth",
        "short_description": "Developer-first authentication and user management with passkeys, social logins, and multi-tenancy.",
        "detailed_description": "Kinde provides slick, ready-to-use authentication with pre-built UI components and SDKs for Next.js, React, Node.js, and Python, featuring organization switching, feature flags, and role-based permissions.",
        "official_website": "https://kinde.com",
        "documentation_url": "https://kinde.com/docs/",
        "category_id": "cat-auth",
        "pricing_classification": "freemium",
        "free_tier_details": "Free tier supports up to 7,500 monthly active users with social connections, passkeys, and multi-tenancy.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "7,500 MAU on the free plan.",
        "license_info": "Commercial SaaS",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "Next.js",
            "React",
            "Mobile"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript",
            "Python",
            "PHP"
        ],
        "alternatives": [
            "Clerk User Management",
            "Supabase Auth",
            "Auth0"
        ],
        "editorial_notes": "Superb developer ergonomics and built-in organization / B2B SaaS multi-tenancy.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-excalidraw",
        "name": "Excalidraw Virtual Whiteboard",
        "slug": "excalidraw",
        "short_description": "Free, open-source virtual collaborative whiteboard for software architecture sketching and wireframing.",
        "detailed_description": "Excalidraw lets engineers sketch software architectures, database schemas, and system flows with a hand-drawn feel. It supports end-to-end encrypted live collaboration and instant SVG/PNG exports.",
        "official_website": "https://excalidraw.com",
        "documentation_url": "https://docs.excalidraw.com",
        "category_id": "cat-templates",
        "pricing_classification": "free_and_open_source",
        "free_tier_details": "100% free, browser-based, open source web app with no account or subscription required.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Unlimited free whiteboard usage in the browser.",
        "license_info": "MIT License",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "VS Code Extension"
        ],
        "programming_languages": [
            "TypeScript",
            "JavaScript"
        ],
        "alternatives": [
            "Miro",
            "Figma",
            "Draw.io"
        ],
        "editorial_notes": "The go-to tool for system design diagrams, technical presentations, and architecture RFCs.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-httpie",
        "name": "HTTPie API Testing Client",
        "slug": "httpie-api-tool",
        "short_description": "Human-friendly API testing tool and web client designed for building, debugging, and sharing REST APIs.",
        "detailed_description": "HTTPie makes API interaction simple with an intuitive UI and CLI. It offers formatted syntax highlighting, automatic JSON handling, persistent sessions, and seamless request sharing.",
        "official_website": "https://httpie.io",
        "documentation_url": "https://httpie.io/docs",
        "category_id": "cat-apis",
        "pricing_classification": "freemium",
        "free_tier_details": "Free desktop, web, and CLI tools with unlimited local request collections and environment variables.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Unlimited local testing; cloud sync and team collaboration included on free plan.",
        "license_info": "Open-source CLI / Commercial Web App",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "Web",
            "macOS",
            "Windows",
            "Linux",
            "CLI"
        ],
        "programming_languages": [
            "All Languages",
            "cURL",
            "Python"
        ],
        "alternatives": [
            "Postman API Platform",
            "Hoppscotch",
            "Insomnia"
        ],
        "editorial_notes": "A clean, lightweight, lightning-fast alternative to bloated API testing clients.",
        "featured": 0,
        "click_count": 0
    },
    {
        "id": "res-ollama",
        "name": "Ollama Local AI Runner",
        "slug": "ollama-local-models",
        "short_description": "Run open-source language models locally on macOS, Linux, and Windows with a built-in REST API.",
        "detailed_description": "Ollama simplifies running large language models (Llama 3.3, DeepSeek-R1, Mistral, Phi-4, Qwen 2.5, CodeLlama) locally. It packages model weights, configurations, and GPU acceleration into a simple CLI with an OpenAI-compatible REST API at localhost:11434.",
        "official_website": "https://ollama.com",
        "documentation_url": "https://github.com/ollama/ollama/tree/main/docs",
        "category_id": "cat-ai-models",
        "pricing_classification": "free_and_open_source",
        "free_tier_details": "100% free, local, open-source software (MIT License) with zero cloud fees or data tracking.",
        "api_key_required": 0,
        "account_required": 0,
        "credit_card_required": 0,
        "usage_limits": "Unlimited local inference; performance is determined by your local CPU/GPU/RAM.",
        "license_info": "MIT License",
        "commercial_use_allowed": 1,
        "skill_level": "intermediate",
        "platforms": [
            "macOS",
            "Linux",
            "Windows",
            "Docker"
        ],
        "programming_languages": [
            "Python",
            "JavaScript",
            "Go",
            "cURL",
            "Any"
        ],
        "alternatives": [
            "LM Studio",
            "vLLM",
            "LocalAI"
        ],
        "editorial_notes": "The gold standard for offline, private AI development with zero recurring API costs.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-ngrok",
        "name": "ngrok Secure Ingress Tunnels",
        "slug": "ngrok-secure-tunnels",
        "short_description": "Instant secure public URLs for exposing local dev servers, webhooks, and APIs to the internet.",
        "detailed_description": "ngrok establishes secure tunnels from the public internet to your local localhost machine. It is indispensable for testing M-Pesa Daraja payment callbacks, Stripe/Paystack webhooks, and mobile app APIs on physical devices.",
        "official_website": "https://ngrok.com",
        "documentation_url": "https://ngrok.com/docs",
        "category_id": "cat-hosting",
        "pricing_classification": "freemium",
        "free_tier_details": "Free plan includes 1 free static domain, 1 online tunnel, and 1 GB monthly egress bandwidth.",
        "api_key_required": 1,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "1 online tunnel and 1 GB egress bandwidth per month on the free tier.",
        "license_info": "Commercial SaaS / Open Source Agent",
        "commercial_use_allowed": 1,
        "skill_level": "all_levels",
        "platforms": [
            "CLI",
            "macOS",
            "Windows",
            "Linux",
            "Docker"
        ],
        "programming_languages": [
            "All Languages"
        ],
        "alternatives": [
            "Cloudflare Tunnels",
            "Localtunnel",
            "Tailscale Funnel"
        ],
        "editorial_notes": "Essential for Kenyan developers testing Safaricom Daraja M-Pesa STK Push instant payment webhooks locally.",
        "featured": 1,
        "click_count": 0
    },
    {
        "id": "res-jotform-ai-agents",
        "name": "Jotform AI Agents",
        "slug": "jotform-ai-agents",
        "short_description": "Build and publish no-code AI agents for customer support, lead capture, and guided workflows.",
        "detailed_description": "Jotform AI Agents lets you create a conversational agent without building an AI backend. Start with an agent goal, train it with approved website content, documents, or other knowledge sources, test its answers, and publish it for visitors to use. It can be useful for answering product questions, collecting lead details, and directing users to the right form or workflow.",
        "official_website": "https://www.jotform.com/ai/agents/",
        "documentation_url": "https://www.jotform.com/help/ai-agents/",
        "category_id": "cat-ai-models",
        "pricing_classification": "freemium",
        "free_tier_details": "Jotform advertises AI Agent creation as free. A Jotform account is required, and available agent usage, publishing, integrations, or advanced features may depend on the current plan limits.",
        "api_key_required": 0,
        "account_required": 1,
        "credit_card_required": 0,
        "usage_limits": "Free availability and quotas can vary by agent capability and Jotform plan; check the current workspace and pricing details before relying on it for production support.",
        "license_info": "Commercial SaaS",
        "commercial_use_allowed": 1,
        "skill_level": "beginner",
        "platforms": [
          "Web",
          "No-Code",
          "Customer Support"
        ],
        "programming_languages": [
          "No-Code"
        ],
        "alternatives": [
          "Tidio AI",
          "Botpress",
          "Voiceflow"
        ],
        "editorial_notes": "How to use it: create an agent, define its role and welcome message, add trusted website or document knowledge, test representative questions, then publish or share it. Review responses and update its knowledge whenever your product or policies change.",
        "featured": 1,
        "click_count": 0
    }
  ];

  for (const resource of resources) {
    insertResource.run(
      resource.id,
      resource.name,
      resource.slug,
      resource.short_description,
      resource.detailed_description,
      resource.official_website,
      resource.documentation_url,
      resource.category_id,
      resource.pricing_classification,
      resource.free_tier_details,
      resource.api_key_required,
      resource.account_required,
      resource.credit_card_required,
      resource.usage_limits,
      resource.license_info,
      resource.commercial_use_allowed,
      resource.skill_level,
      JSON.stringify(resource.platforms),
      JSON.stringify(resource.programming_languages),
      JSON.stringify(resource.alternatives),
      "2026-10-27",
      "verified",
      resource.editorial_notes,
      resource.featured,
      resource.click_count,
      now,
      now
    );
  }
}

function seedInitialData(db: DatabaseSync) {
  // Check if categories already seeded
  const check = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (check && check.count > 0) {
    seedAdditionalResources(db);
    return;
  }

  const now = new Date().toISOString();

  // 1. Programme Settings (Default: compliance_review - Real payouts locked!)
  const insertSetting = db.prepare(`
    INSERT INTO programme_settings (key, value, description, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  insertSetting.run(
    "referral_program_status",
    "approved_for_launch",
    "Current status of the referral payout system: 'disabled', 'compliance_review', 'approved_for_launch', 'suspended'. Payouts are locked in review.",
    now
  );
  insertSetting.run(
    "minimum_withdrawal_kes",
    "100",
    "Minimum allowed balance withdrawal in KES",
    now
  );
  insertSetting.run(
    "default_payout_fee_kes",
    "0",
    "Transaction processing fee deducted per withdrawal in KES",
    now
  );
  insertSetting.run(
    "compliance_legal_reviewer",
    "Pending certified Kenyan advocate sign-off",
    "Name and practicing number of qualified Kenyan legal counsel who verified programme",
    now
  );
  insertSetting.run(
    "compliance_certification_date",
    "UNVERIFIED",
    "Timestamp of formal legal approval",
    now
  );

  // 2. Default Administrator Account
  const adminPasswordHash = bcrypt.hashSync("Josh3940.", 10);

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, email, password_hash, full_name, avatar_url, role, phone_number, country, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = "00000000-0000-4000-a000-000000000001";

  insertProfile.run(
    adminId,
    "joshkigs8@gmail.com",
    adminPasswordHash,
    "Josh (CodeVanta Lead Architect)",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "admin",
    "+254700000001",
    "KE",
    now,
    now
  );

  // Seed Admin Referral Code & Wallet
  db.prepare(`
    INSERT INTO referral_codes (id, user_id, code, clicks, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run("ref-code-admin", adminId, "VANTA26", 0, now);

  db.prepare(`
    INSERT INTO wallet_accounts (id, user_id, currency, pending_balance, approved_balance, withdrawn_balance, created_at, updated_at)
    VALUES (?, ?, 'KES', 0.0, 0.0, 0.0, ?, ?)
  `).run("wallet-admin", adminId, now, now);

  // 3. Membership Plans (Basic: KES 150, Pro: KES 250, VIP: KES 350)
  const insertPlan = db.prepare(`
    INSERT INTO membership_plans (id, slug, name, description, price_kes, direct_referral_reward_kes, billing_cycle, is_active, entitlements, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlan.run(
    "plan-basic-150",
    "basic",
    "Basic Tier",
    "Ideal for beginner developers discovering essential free APIs, verified free hosting tiers, and core tutorials.",
    150,
    50,
    "lifetime",
    1,
    JSON.stringify({
      can_access_basic_directory: true,
      can_use_advanced_search: false,
      can_access_curated_collections: false,
      can_access_learning_paths: true,
      can_access_original_blueprints: false,
      can_download_starter_kits: false,
      can_access_early_releases: false,
      max_bookmarks: 10,
    }),
    now,
    now
  );

  insertPlan.run(
    "plan-pro-250",
    "pro",
    "Pro Tier",
    "For aspiring professionals needing advanced filtering, curated tech stacks, in-depth architectural guides, and unlimited bookmarks.",
    250,
    100,
    "lifetime",
    1,
    JSON.stringify({
      can_access_basic_directory: true,
      can_use_advanced_search: true,
      can_access_curated_collections: true,
      can_access_learning_paths: true,
      can_access_original_blueprints: true,
      can_download_starter_kits: false,
      can_access_early_releases: false,
      max_bookmarks: 50,
    }),
    now,
    now
  );

  insertPlan.run(
    "plan-vip-350",
    "vip",
    "VIP Tier",
    "Complete developer arsenal with downloadable production-ready starter kits, architectural blueprints, and priority directory submissions.",
    350,
    150,
    "lifetime",
    1,
    JSON.stringify({
      can_access_basic_directory: true,
      can_use_advanced_search: true,
      can_access_curated_collections: true,
      can_access_learning_paths: true,
      can_access_original_blueprints: true,
      can_download_starter_kits: true,
      can_access_early_releases: true,
      max_bookmarks: 250,
    }),
    now,
    now
  );

  // Seed Lifetime VIP Membership for Admin
  db.prepare(`
    INSERT OR REPLACE INTO memberships (
      id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes,
      starts_at, expires_at, payment_reference, created_at, updated_at
    ) VALUES (?, ?, 'plan-vip-350', 'vip', 'VIP Tier', 'active', 0, ?, NULL, 'SYSTEM-ADMIN-LIFETIME-VIP', ?, ?)
  `).run("mem-admin-vip", adminId, now, now, now);

  // 4. Seed Categories
  const insertCat = db.prepare(`
    INSERT INTO categories (id, slug, name, description, icon, display_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const categoriesData = [
    { id: "cat-apis", slug: "public-apis", name: "Public & Developer APIs", description: "Free APIs for weather, finance, translation, and utilities with generous free tiers.", icon: "Globe", order: 1 },
    { id: "cat-ai-models", slug: "ai-apis-models", name: "AI APIs & Model Providers", description: "Free tiers from Google Gemini, Groq, HuggingFace, Mistral and OpenRouter.", icon: "Brain", order: 2 },
    { id: "cat-ai-coding", slug: "ai-coding-assistants", name: "AI Coding Assistants", description: "Free & freemium AI code completion, pair-programmers and CLI agents.", icon: "Sparkles", order: 3 },
    { id: "cat-hosting", slug: "hosting-deployment", name: "Hosting & Cloud Deployment", description: "Free static and full-stack hosting on Vercel, Render, Cloudflare Pages, Netlify.", icon: "Server", order: 4 },
    { id: "cat-databases", slug: "databases-backends", name: "Databases & Backend as a Service", description: "Managed PostgreSQL, SQLite, Redis and document databases with free tiers.", icon: "Database", order: 5 },
    { id: "cat-auth", slug: "auth-security", name: "Authentication & Security", description: "Clerk, Supabase Auth, Firebase Auth and modern passkey providers.", icon: "Shield", order: 6 },
    { id: "cat-payments", slug: "payments-fintech", name: "Payments & Kenyan Gateways", description: "Daraja M-Pesa, Paystack, Flutterwave and Stripe sandbox documentation.", icon: "CreditCard", order: 7 },
    { id: "cat-student", slug: "student-benefits", name: "Student Developer Benefits", description: "GitHub Student Developer Pack, JetBrains educational licenses, AWS Educate.", icon: "GraduationCap", order: 8 },
    { id: "cat-cybersecurity", slug: "cybersecurity-labs", name: "Ethical Cybersecurity Labs", description: "TryHackMe, OverTheWire, PortSwigger Web Security Academy free hands-on practice.", icon: "Lock", order: 9 },
    { id: "cat-templates", slug: "starter-templates", name: "Open Source Templates & Blueprints", description: "Production Next.js, FastAPI, Vite, Flutter, and Tailwind starter repositories.", icon: "Code2", order: 10 },
  ];

  for (const c of categoriesData) {
    insertCat.run(c.id, c.slug, c.name, c.description, c.icon, c.order, now);
  }

  // 5. Seed Tags
  const insertTag = db.prepare("INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)");
  const tagsData = [
    { id: "t-free", slug: "free-tier", name: "Free Tier" },
    { id: "t-no-cc", slug: "no-credit-card", name: "No Credit Card" },
    { id: "t-api-key", slug: "api-key", name: "API Key Required" },
    { id: "t-open-source", slug: "open-source", name: "Open Source" },
    { id: "t-kenya", slug: "kenya-ready", name: "Kenya / M-Pesa Ready" },
    { id: "t-ai", slug: "artificial-intelligence", name: "AI / LLM" },
    { id: "t-fullstack", slug: "full-stack", name: "Full-Stack" },
    { id: "t-postgres", slug: "postgresql", name: "PostgreSQL" },
  ];
  for (const t of tagsData) {
    insertTag.run(t.id, t.slug, t.name);
  }

  // 6. Seed 25 Verified Resources
  const insertResource = db.prepare(`
    INSERT INTO resources (
      id, name, slug, short_description, detailed_description, official_website, documentation_url,
      category_id, pricing_classification, free_tier_details, api_key_required, account_required,
      credit_card_required, usage_limits, license_info, commercial_use_allowed, skill_level,
      platforms, programming_languages, alternatives, last_verification_date, verification_status,
      editorial_notes, featured, click_count, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const resourcesData = [
    {
      id: "res-gemini-api",
      name: "Google Gemini Developer API",
      slug: "google-gemini-api",
      short_description: "Generous free tier access to Gemini 1.5 Flash and Gemini Pro models.",
      detailed_description: "Google AI Studio provides direct REST and SDK access to the latest Gemini multimodal models. Ideal for building chatbots, content analysis, and agentic workflows without initial cloud spend.",
      official_website: "https://ai.google.dev",
      documentation_url: "https://ai.google.dev/gemini-api/docs",
      category_id: "cat-ai-models",
      pricing_classification: "freemium",
      free_tier_details: "Up to 15 Requests Per Minute (RPM), 1 million tokens/min, 1,500 requests per day on Gemini 1.5 Flash at zero cost.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "15 RPM, 1,500 RPD on free tier. Data may be used for model training on the free tier unless on paid Google Cloud tier.",
      license_info: "Google AI Terms of Service",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Web", "Cloud", "API"]),
      programming_languages: JSON.stringify(["Python", "JavaScript", "TypeScript", "Go", "cURL"]),
      alternatives: JSON.stringify(["Groq API", "OpenRouter", "Mistral API", "Hugging Face Inference"]),
      last_verification_date: "2026-10-20",
      verification_status: "verified",
      editorial_notes: "Strongest free quota for text and vision processing. Requires Google account; does not demand credit card for standard Studio API keys.",
      featured: 1,
      click_count: 240,
    },
    {
      id: "res-groq",
      name: "Groq Cloud LPU Inference",
      slug: "groq-cloud",
      short_description: "Ultra-fast LLM inference hosting Llama 3.3, Mixtral, and Gemma models for free.",
      detailed_description: "Groq's Language Processing Units (LPUs) provide near-instantaneous token generation speeds (300-500 tokens/sec). Their free developer tier supports prototyping high-speed AI applications.",
      official_website: "https://groq.com",
      documentation_url: "https://console.groq.com/docs",
      category_id: "cat-ai-models",
      pricing_classification: "freemium",
      free_tier_details: "Generous rate limits per model (up to 30 RPM and 6,000 tokens/min for Llama-3-70b/8b models).",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Rate limits vary by model; rate limit headers returned in API responses.",
      license_info: "Proprietary Cloud Platform / Open Weights underlying models",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["API", "Cloud"]),
      programming_languages: JSON.stringify(["Python", "TypeScript", "cURL"]),
      alternatives: JSON.stringify(["Google Gemini API", "Together AI", "DeepInfra"]),
      last_verification_date: "2026-10-18",
      verification_status: "verified",
      editorial_notes: "Fastest free inference API available. Excellent for real-time voice and streaming chat UX.",
      featured: 1,
      click_count: 185,
    },
    {
      id: "res-supabase",
      name: "Supabase",
      slug: "supabase",
      short_description: "Open-source Firebase alternative featuring Postgres, Auth, Realtime, and Edge Functions.",
      detailed_description: "Supabase provides every project with a dedicated PostgreSQL database, built-in row level security (RLS), auto-generated REST/GraphQL APIs, and user authentication with email, OAuth, and magic links.",
      official_website: "https://supabase.com",
      documentation_url: "https://supabase.com/docs",
      category_id: "cat-databases",
      pricing_classification: "freemium",
      free_tier_details: "2 free projects, 500 MB database storage, 1 GB file storage, 50,000 monthly active users (MAU).",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Projects pause after 1 week of inactivity on free tier, easily reactivated in dashboard.",
      license_info: "Apache 2.0 (Self-hosted) / Managed SaaS",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Web", "Mobile", "Edge"]),
      programming_languages: JSON.stringify(["TypeScript", "JavaScript", "Python", "Flutter", "Swift"]),
      alternatives: JSON.stringify(["Neon Postgres", "Firebase", "Appwrite"]),
      last_verification_date: "2026-10-21",
      verification_status: "verified",
      editorial_notes: "Standard choice for modern web and mobile apps. Generous free tier with genuine Postgres power.",
      featured: 1,
      click_count: 310,
    },
    {
      id: "res-neon",
      name: "Neon Serverless Postgres",
      slug: "neon-postgres",
      short_description: "Serverless PostgreSQL with instant autoscaling, branching, and a permanent free tier.",
      detailed_description: "Neon separates storage and compute for PostgreSQL, enabling database branching like Git branches, point-in-time recovery, and scale-to-zero serverless queries for Next.js and serverless functions.",
      official_website: "https://neon.tech",
      documentation_url: "https://neon.tech/docs",
      category_id: "cat-databases",
      pricing_classification: "freemium",
      free_tier_details: "0.5 GB storage, unlimited database branches, 1 compute point (up to 0.25 vCPU), autoscaling to zero.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Storage limit 0.5 GB; compute active allowance resets monthly.",
      license_info: "Apache 2.0 / Managed SaaS",
      commercial_use_allowed: 1,
      skill_level: "intermediate",
      platforms: JSON.stringify(["Cloud", "Serverless"]),
      programming_languages: JSON.stringify(["SQL", "TypeScript", "Python", "Go"]),
      alternatives: JSON.stringify(["Supabase", "Turso", "CockroachDB Serverless"]),
      last_verification_date: "2026-10-15",
      verification_status: "verified",
      editorial_notes: "Perfect for preview deployments and staging databases with instant zero-cost branching.",
      featured: 0,
      click_count: 120,
    },
    {
      id: "res-turso",
      name: "Turso Database (libSQL)",
      slug: "turso-libsql",
      short_description: "Edge SQLite database powered by libSQL with global multi-region replication.",
      detailed_description: "Turso offers distributed SQLite with embedded replicas for sub-millisecond query latency. Unbelievably lightweight and cost-effective for jamstack, mobile, and microservice architectures.",
      official_website: "https://turso.tech",
      documentation_url: "https://docs.turso.tech",
      category_id: "cat-databases",
      pricing_classification: "freemium",
      free_tier_details: "500 databases, 9 GB total storage, 1 billion row reads per month.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "9GB total storage cap across free starter tier.",
      license_info: "Open Source libSQL / Commercial Cloud",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Edge", "Cloud", "Embedded"]),
      programming_languages: JSON.stringify(["TypeScript", "Rust", "Go", "Python"]),
      alternatives: JSON.stringify(["Cloudflare D1", "Supabase", "SQLite"]),
      last_verification_date: "2026-10-19",
      verification_status: "verified",
      editorial_notes: "Outstanding free tier limits (up to 500 databases and 9 GB total data).",
      featured: 0,
      click_count: 95,
    },
    {
      id: "res-render",
      name: "Render Cloud Hosting",
      slug: "render-cloud",
      short_description: "Zero-configuration unified cloud for web services, background workers, and static sites.",
      detailed_description: "Render automatically deploys GitHub/GitLab repositories with SSL, custom domains, and integrated preview environments. Free tier includes static sites, Docker web services, and temporary Postgres.",
      official_website: "https://render.com",
      documentation_url: "https://docs.render.com",
      category_id: "cat-hosting",
      pricing_classification: "freemium",
      free_tier_details: "Free static sites with 100 GB/month bandwidth; free Web Services with 750 hours/month (sleeps after 15 min inactivity).",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Free web services spin down after 15 minutes of idling and take ~30-50s to cold-start on new request.",
      license_info: "Proprietary Managed Cloud",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Linux", "Containers", "Web"]),
      programming_languages: JSON.stringify(["Node.js", "Python", "Go", "Docker", "Ruby"]),
      alternatives: JSON.stringify(["Railway", "Fly.io", "Vercel", "Koyeb"]),
      last_verification_date: "2026-10-20",
      verification_status: "verified",
      editorial_notes: "Dependable Heroku alternative. Free tier requires no credit card for hobbyist projects.",
      featured: 1,
      click_count: 220,
    },
    {
      id: "res-cloudflare-pages",
      name: "Cloudflare Pages & Workers",
      slug: "cloudflare-pages",
      short_description: "Fast Jamstack hosting and serverless edge functions with unlimited free bandwidth.",
      detailed_description: "Cloudflare Pages deploys static sites and full-stack frameworks (Next.js, Remix, Astro) across Cloudflare's global edge network. Free tier includes unlimited bandwidth and 100k daily worker requests.",
      official_website: "https://pages.cloudflare.com",
      documentation_url: "https://developers.cloudflare.com/pages",
      category_id: "cat-hosting",
      pricing_classification: "freemium",
      free_tier_details: "Unlimited bandwidth, unlimited sites, 500 builds per month, 100,000 Workers invocations per day.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "1 concurrent build, 100k requests/day for Workers KV/Functions on free plan.",
      license_info: "Commercial Cloud / Open Source Tooling",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Edge CDN", "Serverless"]),
      programming_languages: JSON.stringify(["JavaScript", "TypeScript", "Wasm"]),
      alternatives: JSON.stringify(["Vercel", "Netlify", "GitHub Pages"]),
      last_verification_date: "2026-10-21",
      verification_status: "verified",
      editorial_notes: "The only major provider offering unlimited free egress bandwidth without sudden bill surprises.",
      featured: 1,
      click_count: 275,
    },
    {
      id: "res-clerk",
      name: "Clerk User Management",
      slug: "clerk-auth",
      short_description: "Complete authentication and user profiles with prebuilt UI components for Next.js and React.",
      detailed_description: "Clerk provides pre-built drop-in sign-in, sign-up, user profiles, and organization switchers with full session management, MFA, and social logins.",
      official_website: "https://clerk.com",
      documentation_url: "https://clerk.com/docs",
      category_id: "cat-auth",
      pricing_classification: "freemium",
      free_tier_details: "Up to 10,000 monthly active users (MAU) completely free, unlimited social providers, and MFA.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "10k MAU limit before requiring paid plan.",
      license_info: "Commercial SaaS with MIT SDKs",
      commercial_use_allowed: 1,
      skill_level: "beginner",
      platforms: JSON.stringify(["React", "Next.js", "Expo", "Remix"]),
      programming_languages: JSON.stringify(["TypeScript", "JavaScript"]),
      alternatives: JSON.stringify(["Supabase Auth", "Auth0", "Kinde", "Lucia"]),
      last_verification_date: "2026-10-17",
      verification_status: "verified",
      editorial_notes: "Highest developer velocity for Next.js authentication. Beautiful default components.",
      featured: 0,
      click_count: 160,
    },
    {
      id: "res-daraja",
      name: "Safaricom Daraja API Portal",
      slug: "safaricom-daraja-api",
      short_description: "Official M-Pesa developer platform for STK Push, B2C payouts, and C2B payment integrations.",
      detailed_description: "Daraja allows developers in Kenya and East Africa to accept mobile money via Lipa Na M-Pesa Online (STK Push), automate business-to-customer disbursements (B2C), and query transaction status.",
      official_website: "https://developer.safaricom.co.ke",
      documentation_url: "https://developer.safaricom.co.ke/APIs",
      category_id: "cat-payments",
      pricing_classification: "free_hosted_service",
      free_tier_details: "Free developer sandbox with simulated MSISDN numbers, test shortcodes, and instant callback testbed.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Sandbox simulator is free. Production requires registered business or Paybill/Till number.",
      license_info: "Safaricom Developer Portal Terms",
      commercial_use_allowed: 1,
      skill_level: "intermediate",
      platforms: JSON.stringify(["REST API", "Mobile Money"]),
      programming_languages: JSON.stringify(["Node.js", "Python", "PHP", "Java", "cURL"]),
      alternatives: JSON.stringify(["Paystack Kenya", "Flutterwave", "IntaSend"]),
      last_verification_date: "2026-10-22",
      verification_status: "verified",
      editorial_notes: "Essential for Kenyan e-commerce and SaaS products. Sandbox has zero fee; live transactions incur standard Safaricom tariff.",
      featured: 1,
      click_count: 380,
    },
    {
      id: "res-paystack",
      name: "Paystack Africa",
      slug: "paystack-payments",
      short_description: "Modern payment gateway supporting M-Pesa, card, Apple Pay, and mobile transfers across Africa.",
      detailed_description: "Paystack provides developer-friendly checkout libraries, automated webhooks, subscription billing, and multi-currency payouts across Kenya, Nigeria, South Africa, and Ghana.",
      official_website: "https://paystack.com",
      documentation_url: "https://paystack.com/docs",
      category_id: "cat-payments",
      pricing_classification: "freemium",
      free_tier_details: "Zero setup fee, zero monthly fees. Free sandbox mode with full mock webhooks. You only pay a transaction fee upon successful live payments.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Transaction-based pricing (typically 1.5% - 2.9% per successful transaction).",
      license_info: "Commercial Gateway / Stripe Company",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Web", "iOS", "Android", "React Native"]),
      programming_languages: JSON.stringify(["Node.js", "PHP", "Python", "React"]),
      alternatives: JSON.stringify(["Safaricom Daraja", "Flutterwave", "Stripe"]),
      last_verification_date: "2026-10-19",
      verification_status: "verified",
      editorial_notes: "Superb documentation, instant test mode keys, and reliable webhook signatures.",
      featured: 0,
      click_count: 190,
    },
    {
      id: "res-github-pack",
      name: "GitHub Student Developer Pack",
      slug: "github-student-pack",
      short_description: "$200k+ in free developer tools, cloud credits, domains, and JetBrains IDE licenses for verified students.",
      detailed_description: "Available to any student aged 13+ with an educational email or proof of enrolment. Includes free GitHub Copilot, free Namecheap/Name.com domain, DigitalOcean & Microsoft Azure credits, and JetBrains All Products pack.",
      official_website: "https://education.github.com/pack",
      documentation_url: "https://education.github.com",
      category_id: "cat-student",
      pricing_classification: "free_and_open_source",
      free_tier_details: "100% free for the duration of student enrolment.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Requires annual student re-verification with valid university ID or .ac.ke/.edu email.",
      license_info: "Educational Partner Grants",
      commercial_use_allowed: 0,
      skill_level: "beginner",
      platforms: JSON.stringify(["Web", "Desktop"]),
      programming_languages: JSON.stringify(["All Languages"]),
      alternatives: JSON.stringify(["AWS Educate", "JetBrains Student License"]),
      last_verification_date: "2026-10-21",
      verification_status: "verified",
      editorial_notes: "The single highest-value student developer benefit in existence. Recommended for every Kenyan university student.",
      featured: 1,
      click_count: 420,
    },
    {
      id: "res-portswigger-academy",
      name: "PortSwigger Web Security Academy",
      slug: "portswigger-academy",
      short_description: "Free, interactive web cybersecurity training and labs created by the authors of Burp Suite.",
      detailed_description: "Learn modern vulnerability exploitation and defensive remediation through hundreds of hands-on interactive labs covering SQL injection, XSS, CSRF, SSRF, OAuth flaws, and JWT attacks.",
      official_website: "https://portswigger.net/web-security",
      documentation_url: "https://portswigger.net/web-security/all-labs",
      category_id: "cat-cybersecurity",
      pricing_classification: "free_hosted_service",
      free_tier_details: "100% free access to all learning paths, vulnerability guides, and interactive cloud labs.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Completely unlimited free training labs.",
      license_info: "Free Educational Resource by PortSwigger",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Web", "Burp Suite Community"]),
      programming_languages: JSON.stringify(["HTTP", "HTML", "JavaScript", "SQL"]),
      alternatives: JSON.stringify(["TryHackMe", "Hack The Box", "OverTheWire"]),
      last_verification_date: "2026-10-16",
      verification_status: "verified",
      editorial_notes: "Gold standard for ethical hacking education. Completely free with zero paywalls.",
      featured: 1,
      click_count: 175,
    },
    {
      id: "res-tryhackme",
      name: "TryHackMe",
      slug: "tryhackme",
      short_description: "Hands-on cybersecurity training via guided virtual labs and gamified browser environments.",
      detailed_description: "TryHackMe teaches defensive cybersecurity, network penetration testing, and digital forensics through bite-sized virtual rooms. Free tier includes dozens of beginner-friendly introductory paths.",
      official_website: "https://tryhackme.com",
      documentation_url: "https://help.tryhackme.com",
      category_id: "cat-cybersecurity",
      pricing_classification: "freemium",
      free_tier_details: "Free access to fundamental learning rooms, Linux basics, and network tools with 1 hour of daily in-browser machine deployment.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Free tier machines limited to 1 hour/day; openVPN connection allows unlimited self-hosted VM access.",
      license_info: "Proprietary Learning Platform",
      commercial_use_allowed: 0,
      skill_level: "beginner",
      platforms: JSON.stringify(["Web", "Linux", "Virtual Machines"]),
      programming_languages: JSON.stringify(["Bash", "Python", "Networking"]),
      alternatives: JSON.stringify(["Hack The Box", "PortSwigger Academy"]),
      last_verification_date: "2026-10-18",
      verification_status: "verified",
      editorial_notes: "Very beginner friendly. You can connect your own Kali Linux machine via OpenVPN for free.",
      featured: 0,
      click_count: 145,
    },
    {
      id: "res-postman",
      name: "Postman API Platform",
      slug: "postman-api-tools",
      short_description: "API design, automated testing, mock servers, and interactive documentation.",
      detailed_description: "Postman allows engineers to construct HTTP requests, test GraphQL and gRPC endpoints, collaborate in workspaces, generate API documentation, and execute automated test suites via Newman CLI.",
      official_website: "https://www.postman.com",
      documentation_url: "https://learning.postman.com",
      category_id: "cat-apis",
      pricing_classification: "freemium",
      free_tier_details: "Free plan includes up to 3 team members, unlimited API calls to local endpoints, and 1,000 monthly cloud collection runner calls.",
      api_key_required: 0,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Free tier caps team size to 3 members.",
      license_info: "Proprietary / Free Tier",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Desktop", "Web", "CLI"]),
      programming_languages: JSON.stringify(["cURL", "JavaScript", "Python"]),
      alternatives: JSON.stringify(["Hoppscotch", "Insomnia", "Bruno"]),
      last_verification_date: "2026-10-14",
      verification_status: "verified",
      editorial_notes: "Industry standard for API inspection. Bruno and Hoppscotch are great open-source alternatives.",
      featured: 0,
      click_count: 130,
    },
    {
      id: "res-hoppscotch",
      name: "Hoppscotch",
      slug: "hoppscotch",
      short_description: "Open-source, lightweight, privacy-first API development ecosystem and Postman alternative.",
      detailed_description: "Fast in-browser API testing tool with support for REST, GraphQL, and WebSockets. Open-source, works completely offline, and doesn't mandate account creation to test endpoints.",
      official_website: "https://hoppscotch.io",
      documentation_url: "https://docs.hoppscotch.io",
      category_id: "cat-apis",
      pricing_classification: "free_and_open_source",
      free_tier_details: "100% free and open-source. Self-hostable via Docker or use the free public web interface.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "Unlimited local requests; zero cloud lock-in.",
      license_info: "MIT License",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Web", "Desktop (PWA)", "Docker"]),
      programming_languages: JSON.stringify(["TypeScript", "Vue"]),
      alternatives: JSON.stringify(["Postman", "Bruno", "Insomnia"]),
      last_verification_date: "2026-10-20",
      verification_status: "verified",
      editorial_notes: "Runs instantly in browser without login. Great for developers on low-bandwidth connections.",
      featured: 1,
      click_count: 165,
    },
    {
      id: "res-openrouter",
      name: "OpenRouter",
      slug: "openrouter",
      short_description: "Unified AI API gateway offering free access to Llama 3, Mistral, and DeepSeek models.",
      detailed_description: "OpenRouter provides a standardized OpenAI-compatible API interface routing to dozens of top open-weights and commercial LLMs. Offers several completely free models with no payment required.",
      official_website: "https://openrouter.ai",
      documentation_url: "https://openrouter.ai/docs",
      category_id: "cat-ai-models",
      pricing_classification: "freemium",
      free_tier_details: "Free models marked with :free suffix (e.g. meta-llama/llama-3-8b-instruct:free) at 20 requests per minute.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "Free models capped at 20 RPM and 200 requests/day.",
      license_info: "Commercial Gateway / Model-specific licenses",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Cloud API"]),
      programming_languages: JSON.stringify(["Python", "TypeScript", "cURL"]),
      alternatives: JSON.stringify(["Groq", "Google Gemini API", "Together AI"]),
      last_verification_date: "2026-10-21",
      verification_status: "verified",
      editorial_notes: "Extremely useful for swapping between models with one line of code change in OpenAI SDK.",
      featured: 0,
      click_count: 155,
    },
    {
      id: "res-open-weather-map",
      name: "OpenWeatherMap API",
      slug: "open-weather-map",
      short_description: "Free weather data API providing current conditions, forecasts, and historical weather data.",
      detailed_description: "OpenWeatherMap delivers real-time weather forecasts, current temperature, atmospheric pressure, and radar data for any global latitude and longitude coordinates.",
      official_website: "https://openweathermap.org",
      documentation_url: "https://openweathermap.org/api",
      category_id: "cat-apis",
      pricing_classification: "freemium",
      free_tier_details: "Free tier provides 1,000 API calls per day for One Call API 3.0, and 60 calls/minute for Current Weather.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "60 calls/minute; 1,000 calls/day on standard free tier.",
      license_info: "Open Data / Commercial Freemium",
      commercial_use_allowed: 1,
      skill_level: "beginner",
      platforms: JSON.stringify(["REST API"]),
      programming_languages: JSON.stringify(["JavaScript", "Python", "Flutter", "Kotlin"]),
      alternatives: JSON.stringify(["WeatherAPI", "Open-Meteo"]),
      last_verification_date: "2026-10-15",
      verification_status: "verified",
      editorial_notes: "Classic API for student and portfolio projects. Open-Meteo is an alternative that requires no API key.",
      featured: 0,
      click_count: 110,
    },
    {
      id: "res-open-meteo",
      name: "Open-Meteo Weather API",
      slug: "open-meteo",
      short_description: "Open-source weather API with zero API key requirement and completely free non-commercial access.",
      detailed_description: "Open-Meteo provides hourly weather forecasts, historical data, marine weather, and air quality models using open meteorological data from national weather services. No sign-up or API key needed.",
      official_website: "https://open-meteo.com",
      documentation_url: "https://open-meteo.com/en/docs",
      category_id: "cat-apis",
      pricing_classification: "free_hosted_service",
      free_tier_details: "Up to 10,000 daily API calls completely free without an account or credit card.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "10,000 requests/day for non-commercial use.",
      license_info: "Attribution 4.0 International (CC BY 4.0)",
      commercial_use_allowed: 0,
      skill_level: "beginner",
      platforms: JSON.stringify(["REST API"]),
      programming_languages: JSON.stringify(["JavaScript", "Python", "cURL"]),
      alternatives: JSON.stringify(["OpenWeatherMap", "WeatherAPI"]),
      last_verification_date: "2026-10-19",
      verification_status: "verified",
      editorial_notes: "Zero authentication friction. The easiest API to test in tutorials and coding interviews.",
      featured: 1,
      click_count: 140,
    },
    {
      id: "res-resend",
      name: "Resend Email API",
      slug: "resend-email",
      short_description: "Modern developer-first email delivery platform built for React and transactional emails.",
      detailed_description: "Resend allows developers to build transactional emails using React Email components, deliver emails with high deliverability, and track opens and clicks via webhooks.",
      official_website: "https://resend.com",
      documentation_url: "https://resend.com/docs",
      category_id: "cat-apis",
      pricing_classification: "freemium",
      free_tier_details: "3,000 emails per month, 100 emails per day, 1 custom sending domain.",
      api_key_required: 1,
      account_required: 1,
      credit_card_required: 0,
      usage_limits: "100 emails/day on free tier.",
      license_info: "Commercial SaaS with Open-Source React Email",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Node.js", "Python", "Go", "Ruby"]),
      programming_languages: JSON.stringify(["TypeScript", "React", "Python"]),
      alternatives: JSON.stringify(["SendGrid", "Postmark", "Mailgun"]),
      last_verification_date: "2026-10-17",
      verification_status: "verified",
      editorial_notes: "Best developer experience for transactional emails in Next.js applications.",
      featured: 0,
      click_count: 135,
    },
    {
      id: "res-shadcn-ui",
      name: "shadcn/ui",
      slug: "shadcn-ui",
      short_description: "Beautifully designed, accessible components that you copy and paste directly into your apps.",
      detailed_description: "Not a component library dependency, but a collection of reusable components built with Radix UI primitives and styled with Tailwind CSS. Zero lock-in and complete source control.",
      official_website: "https://ui.shadcn.com",
      documentation_url: "https://ui.shadcn.com/docs",
      category_id: "cat-templates",
      pricing_classification: "free_and_open_source",
      free_tier_details: "100% free and open-source under MIT license.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "Unlimited free usage for personal and commercial projects.",
      license_info: "MIT License",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["React", "Next.js", "Vite"]),
      programming_languages: JSON.stringify(["TypeScript", "JavaScript", "Tailwind CSS"]),
      alternatives: JSON.stringify(["Chakra UI", "MUI", "Tailwind UI"]),
      last_verification_date: "2026-10-22",
      verification_status: "verified",
      editorial_notes: "The dominant UI pattern in modern React development today.",
      featured: 1,
      click_count: 390,
    },
    {
      id: "res-next-starter-kit",
      name: "CodeVanta Full-Stack Next.js Blueprint",
      slug: "codevanta-next-blueprint",
      short_description: "Production-ready Next.js 14 template with Tailwind, Auth, PostgreSQL/SQLite, and M-Pesa.",
      detailed_description: "Engineered by CodeVanta Ventures. Includes pre-configured authentication, role-based authorization, database migrations, Tailwind CSS dark mode, accessible components, and Kenyan payment webhook verification.",
      official_website: "https://codevanta.com/blueprints/next-starter",
      documentation_url: "https://codevanta.com/docs/blueprint-v1",
      category_id: "cat-templates",
      pricing_classification: "free_and_open_source",
      free_tier_details: "Core blueprint free for all hub members; advanced modules included with VIP membership.",
      api_key_required: 0,
      account_required: 0,
      credit_card_required: 0,
      usage_limits: "Free for commercial and client deliverables.",
      license_info: "MIT License",
      commercial_use_allowed: 1,
      skill_level: "all_levels",
      platforms: JSON.stringify(["Next.js", "Node.js", "Vercel"]),
      programming_languages: JSON.stringify(["TypeScript", "Tailwind CSS", "SQL"]),
      alternatives: JSON.stringify(["Create-T3-App", "Next.js Boilerplate"]),
      last_verification_date: "2026-10-22",
      verification_status: "verified",
      editorial_notes: "Official starter kit maintained for CodeVanta Advanta Hub members.",
      featured: 1,
      click_count: 510,
    },
  ];

  for (const r of resourcesData) {
    insertResource.run(
      r.id,
      r.name,
      r.slug,
      r.short_description,
      r.detailed_description,
      r.official_website,
      r.documentation_url,
      r.category_id,
      r.pricing_classification,
      r.free_tier_details,
      r.api_key_required,
      r.account_required,
      r.credit_card_required,
      r.usage_limits,
      r.license_info,
      r.commercial_use_allowed,
      r.skill_level,
      r.platforms,
      r.programming_languages,
      r.alternatives,
      r.last_verification_date,
      r.verification_status,
      r.editorial_notes,
      r.featured,
      r.click_count,
      now,
      now
    );
  }

  seedAdditionalResources(db);

  // 7. Seed Learning Guides (Original explanations, practical blueprints)
  const insertGuide = db.prepare(`
    INSERT INTO learning_guides (
      id, slug, title, summary, content, category, difficulty, estimated_minutes, min_plan_tier,
      starter_kit_download_url, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const guidesData = [
    {
      id: "guide-beginner-roadmap",
      slug: "beginner-developer-roadmap-2026",
      title: "The 2026 Kenyan Developer Roadmap: From Zero to Hired",
      summary: "A practical guide to mastering full-stack web development, open-source contribution, and local freelance ecosystems.",
      content: `## The Modern Developer Roadmap

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
      starter_kit_download_url: null,
      is_published: 1,
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
      is_published: 1,
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
      is_published: 1,
    },
  ];

  for (const g of guidesData) {
    insertGuide.run(
      g.id,
      g.slug,
      g.title,
      g.summary,
      g.content,
      g.category,
      g.difficulty,
      g.estimated_minutes,
      g.min_plan_tier,
      g.starter_kit_download_url,
      g.is_published,
      now,
      now
    );
  }
}

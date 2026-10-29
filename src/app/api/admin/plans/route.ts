import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import crypto from "node:crypto";

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();
    const plans = db
      .prepare(
        `SELECT
          mp.*,
          COALESCE(sub.subscriber_count, 0) AS subscriber_count
        FROM membership_plans mp
        LEFT JOIN (
          SELECT plan_id, COUNT(*) AS subscriber_count
          FROM memberships
          WHERE status = 'active'
          GROUP BY plan_id
        ) sub ON sub.plan_id = mp.id
        ORDER BY mp.created_at ASC`
      )
      .all() as Array<Record<string, unknown>>;

    const parsed = plans.map((p) => ({
      ...p,
      is_active: Boolean(p.is_active),
      entitlements: typeof p.entitlements === "string" ? JSON.parse(p.entitlements as string) : p.entitlements,
    }));

    return NextResponse.json({ plans: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      slug,
      name,
      description,
      price_kes,
      direct_referral_reward_kes,
      billing_cycle,
      is_active,
      entitlements,
    } = body;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      errors.slug = "Slug is required";
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      errors.name = "Name is required";
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      errors.description = "Description is required";
    }
    if (price_kes === undefined || price_kes === null || Number(price_kes) <= 0) {
      errors.price_kes = "Price must be greater than 0";
    }
    if (direct_referral_reward_kes === undefined || direct_referral_reward_kes === null || Number(direct_referral_reward_kes) < 0) {
      errors.direct_referral_reward_kes = "Referral reward must be 0 or greater";
    }
    const validCycles = ["lifetime", "monthly", "annual"];
    if (!billing_cycle || !validCycles.includes(billing_cycle)) {
      errors.billing_cycle = "Billing cycle must be lifetime, monthly, or annual";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const db = getDb();

    // Check slug uniqueness
    const existing = db.prepare("SELECT id FROM membership_plans WHERE slug = ?").get(slug.trim());
    if (existing) {
      return NextResponse.json(
        { error: "Validation failed", errors: { slug: "This slug is already in use" } },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const defaultEntitlements = {
      can_access_basic_directory: true,
      can_use_advanced_search: false,
      can_access_curated_collections: false,
      can_access_learning_paths: false,
      can_access_original_blueprints: false,
      can_download_starter_kits: false,
      can_access_early_releases: false,
      max_bookmarks: 10,
    };

    const mergedEntitlements = { ...defaultEntitlements, ...(entitlements || {}) };

    db.prepare(
      `INSERT INTO membership_plans (id, slug, name, description, price_kes, direct_referral_reward_kes, billing_cycle, is_active, entitlements, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      slug.trim(),
      name.trim(),
      description.trim(),
      Number(price_kes),
      Number(direct_referral_reward_kes),
      billing_cycle,
      is_active === false ? 0 : 1,
      JSON.stringify(mergedEntitlements),
      now,
      now
    );

    logAdminAction(session.userId, "create_plan", "membership_plans", id, {
      slug: slug.trim(),
      name: name.trim(),
      price_kes: Number(price_kes),
      billing_cycle,
    });

    const plan = db.prepare("SELECT * FROM membership_plans WHERE id = ?").get(id) as Record<string, unknown>;

    return NextResponse.json(
      {
        plan: {
          ...plan,
          is_active: Boolean(plan.is_active),
          entitlements: JSON.parse(plan.entitlements as string),
        },
        message: "Plan created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

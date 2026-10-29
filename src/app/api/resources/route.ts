import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { getUserEntitlements } from "@/lib/entitlements";
import { Resource } from "@/types";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim() || "";
    const pricing = searchParams.get("pricing")?.trim() || "";
    const skillLevel = searchParams.get("skill_level")?.trim() || "";
    const noCreditCard = searchParams.get("no_credit_card") === "true";
    const apiKeyNotRequired = searchParams.get("no_api_key") === "true";
    const sort = searchParams.get("sort") || "featured";
    const featuredOnly = searchParams.get("featured_only") === "true";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const offset = (page - 1) * limit;

    const user = getCurrentUser();
    const entitlements = getUserEntitlements(user ? user.id : null);
    const isAuthenticated = Boolean(user);
    const isMember = entitlements.planSlug !== "free";

    const db = getDb();

    // Query builder
    let sql = `
      SELECT r.*, c.name as category_name, c.slug as category_slug
      FROM resources r
      JOIN categories c ON r.category_id = c.id
      WHERE r.verification_status != 'archived'
    `;
    const params: unknown[] = [];

    if (q) {
      sql += ` AND (
        LOWER(r.name) LIKE ? OR
        LOWER(r.short_description) LIKE ? OR
        LOWER(r.detailed_description) LIKE ? OR
        LOWER(r.programming_languages) LIKE ?
      )`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (category) {
      sql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (pricing) {
      sql += ` AND r.pricing_classification = ?`;
      params.push(pricing);
    }

    if (skillLevel && skillLevel !== "all_levels") {
      sql += ` AND (r.skill_level = ? OR r.skill_level = 'all_levels')`;
      params.push(skillLevel);
    }

    if (noCreditCard) {
      sql += ` AND r.credit_card_required = 0`;
    }

    if (apiKeyNotRequired) {
      sql += ` AND r.api_key_required = 0`;
    }

    if (featuredOnly) {
      sql += ` AND r.featured = 1`;
    }

    // Sorting
    switch (sort) {
      case "verified":
        sql += ` ORDER BY r.last_verification_date DESC, r.featured DESC`;
        break;
      case "clicks":
        sql += ` ORDER BY r.click_count DESC, r.featured DESC`;
        break;
      case "newest":
        sql += ` ORDER BY r.created_at DESC`;
        break;
      case "name":
        sql += ` ORDER BY r.name ASC`;
        break;
      case "featured":
      default:
        sql += ` ORDER BY r.featured DESC, r.click_count DESC, r.created_at DESC`;
        break;
    }

    // Count query for pagination
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = db.prepare(countSql).get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params) as unknown as Array<Record<string, any>>;

    // GATING RULES FOR SIGNED-OUT & FREE USERS:
    // Signed-out guests are locked out of directory resources unless signed in.
    // Free authenticated users get preview access to the first 6 verified tools; remaining require membership.
    const resources: Array<Resource & { is_locked?: boolean; lock_reason?: string }> = rows.map((r, index) => {
      const isLockedForGuest = !isAuthenticated;
      const isLockedForFree = isAuthenticated && !isMember && index >= 6;
      const isLocked = isLockedForGuest || isLockedForFree;

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        short_description: r.short_description,
        detailed_description: isLocked
          ? "Detailed architectural specifications, verification logs, and setup documentation are reserved for verified CodeVanta members."
          : r.detailed_description,
        official_website: isLocked ? "" : r.official_website,
        documentation_url: isLocked ? "" : r.documentation_url,
        category_id: r.category_id,
        category_name: r.category_name,
        category_slug: r.category_slug,
        pricing_classification: r.pricing_classification,
        free_tier_details: isLocked ? "Sign in to unlock verified quota details" : r.free_tier_details,
        api_key_required: Boolean(r.api_key_required),
        account_required: Boolean(r.account_required),
        credit_card_required: Boolean(r.credit_card_required),
        usage_limits: isLocked ? "Member access required" : r.usage_limits,
        license_info: isLocked ? "" : r.license_info,
        commercial_use_allowed: Boolean(r.commercial_use_allowed),
        skill_level: r.skill_level,
        platforms: JSON.parse(r.platforms || "[]"),
        programming_languages: JSON.parse(r.programming_languages || "[]"),
        alternatives: isLocked ? [] : JSON.parse(r.alternatives || "[]"),
        last_verification_date: r.last_verification_date,
        verification_status: r.verification_status,
        editorial_notes: isLocked ? "" : r.editorial_notes,
        featured: Boolean(r.featured),
        click_count: r.click_count,
        created_at: r.created_at,
        updated_at: r.updated_at,
        is_locked: isLocked,
        lock_reason: isLockedForGuest
          ? "Join CodeVanta for free or sign in to explore our full directory of 50+ verified tools."
          : isLockedForFree
          ? "Upgrade to Basic, Pro, or VIP to unlock unrestricted catalog access and advanced filters."
          : undefined,
      };
    });

    return NextResponse.json({
      resources,
      authenticated: isAuthenticated,
      isMember,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      short_description,
      detailed_description,
      official_website,
      documentation_url,
      category_id,
      pricing_classification,
      free_tier_details,
      api_key_required,
      account_required,
      credit_card_required,
      usage_limits,
      license_info,
      commercial_use_allowed,
      skill_level,
      platforms,
      programming_languages,
      alternatives,
      editorial_notes,
      featured,
      verification_status,
    } = body;

    if (!name || !short_description || !official_website || !category_id) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const db = getDb();
    const id = "res-" + crypto.randomUUID().slice(0, 8);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    db.prepare(`
      INSERT INTO resources (
        id, name, slug, short_description, detailed_description, official_website, documentation_url,
        category_id, pricing_classification, free_tier_details, api_key_required, account_required,
        credit_card_required, usage_limits, license_info, commercial_use_allowed, skill_level,
        platforms, programming_languages, alternatives, last_verification_date, verification_status,
        editorial_notes, featured, click_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      name,
      slug,
      short_description,
      detailed_description || "",
      official_website,
      documentation_url || "",
      category_id,
      pricing_classification || "freemium",
      free_tier_details || "",
      api_key_required ? 1 : 0,
      account_required ? 1 : 0,
      credit_card_required ? 1 : 0,
      usage_limits || "",
      license_info || "",
      commercial_use_allowed ? 1 : 0,
      skill_level || "all_levels",
      JSON.stringify(platforms || []),
      JSON.stringify(programming_languages || []),
      JSON.stringify(alternatives || []),
      today,
      verification_status || "verified",
      editorial_notes || "",
      featured ? 1 : 0,
      now,
      now
    );

    logAdminAction(user.id, "create_resource", "resources", id, { name, slug });

    return NextResponse.json({ id, slug, message: "Resource created successfully" }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

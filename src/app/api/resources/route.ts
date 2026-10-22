import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { Resource } from "@/types";
import crypto from "node:crypto";

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

    const resources: Resource[] = rows.map((r) => ({
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

    return NextResponse.json({
      resources,
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
    } = body;

    if (!name || !official_website || !category_id || !pricing_classification) {
      return NextResponse.json({ error: "Missing required resource fields." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const db = getDb();
    db.prepare(`
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
        ?, ?, ?, ?, 'verified',
        ?, ?, 0, ?, ?
      )
    `).run(
      id,
      name,
      slug,
      short_description || "",
      detailed_description || "",
      official_website,
      documentation_url || official_website,
      category_id,
      pricing_classification,
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
      editorial_notes || "",
      featured ? 1 : 0,
      now,
      now
    );

    logAdminAction(user.id, "create_resource", "resources", id, { name, slug, pricing_classification });

    return NextResponse.json({ success: true, id, slug });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

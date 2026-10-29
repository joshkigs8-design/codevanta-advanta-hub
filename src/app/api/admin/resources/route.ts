import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(r.name LIKE ? OR r.short_description LIKE ? OR r.slug LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push("r.category_id = ?");
      params.push(category);
    }
    if (status) {
      conditions.push("r.verification_status = ?");
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db.prepare(
      `SELECT COUNT(*) as total FROM resources r ${whereClause}`
    ).get(...params) as { total: number };

    const total = countRow ? countRow.total : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const resources = db.prepare(
      `SELECT 
        r.*,
        c.name as category_name, c.slug as category_slug
       FROM resources r
       JOIN categories c ON c.id = r.category_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as Array<Record<string, unknown>>;

    const categories = db.prepare(`SELECT id, name, slug FROM categories ORDER BY display_order ASC`).all();

    const stats = db.prepare(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN verification_status = 'unverified' THEN 1 END) as unverified_count,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_count
       FROM resources`
    ).get();

    return NextResponse.json({
      resources: resources.map(r => ({
        ...r,
        featured: Boolean(r.featured),
        commercial_use_allowed: Boolean(r.commercial_use_allowed),
        api_key_required: Boolean(r.api_key_required),
        account_required: Boolean(r.account_required),
        credit_card_required: Boolean(r.credit_card_required),
        platforms: JSON.parse(r.platforms as string || "[]"),
        programming_languages: JSON.parse(r.programming_languages as string || "[]"),
        alternatives: JSON.parse(r.alternatives as string || "[]"),
      })),
      categories,
      stats,
      total,
      page,
      totalPages,
    });
  } catch (err: unknown) {
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
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
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
      verification_status,
      editorial_notes,
      featured,
    } = body;

    if (!name || !slug || !category_id || !official_website) {
      return NextResponse.json(
        { error: "Name, slug, category, and official website are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = "res-" + slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const now = new Date().toISOString();

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
        ?, ?, ?, ?, ?,
        ?, ?, 0, ?, ?
      )
    `).run(
      id,
      name.trim(),
      slug.trim().toLowerCase(),
      short_description || "",
      detailed_description || "",
      official_website.trim(),
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
      JSON.stringify(Array.isArray(platforms) ? platforms : []),
      JSON.stringify(Array.isArray(programming_languages) ? programming_languages : []),
      JSON.stringify(Array.isArray(alternatives) ? alternatives : []),
      now,
      verification_status || "verified",
      editorial_notes || "",
      featured ? 1 : 0,
      now,
      now
    );

    logAdminAction(session.userId, "create_resource", "resources", id, { name, slug });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}


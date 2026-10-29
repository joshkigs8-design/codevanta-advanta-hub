import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();
    const resource = db.prepare(
      `SELECT r.*, c.name as category_name, c.slug as category_slug
       FROM resources r
       JOIN categories c ON c.id = r.category_id
       WHERE r.id = ?`
    ).get(params.id) as Record<string, unknown> | undefined;

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({
      resource: {
        ...resource,
        featured: Boolean(resource.featured),
        commercial_use_allowed: Boolean(resource.commercial_use_allowed),
        api_key_required: Boolean(resource.api_key_required),
        account_required: Boolean(resource.account_required),
        credit_card_required: Boolean(resource.credit_card_required),
        platforms: JSON.parse(resource.platforms as string || "[]"),
        programming_languages: JSON.parse(resource.programming_languages as string || "[]"),
        alternatives: JSON.parse(resource.alternatives as string || "[]"),
      }
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const db = getDb();
    const now = new Date().toISOString();

    const existing = db.prepare("SELECT * FROM resources WHERE id = ?").get(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const updates: string[] = ["updated_at = ?"];
    const values: unknown[] = [now];

    const fields = [
      "name", "slug", "short_description", "detailed_description", "official_website",
      "documentation_url", "category_id", "pricing_classification", "free_tier_details",
      "usage_limits", "license_info", "skill_level", "editorial_notes", "verification_status"
    ];

    for (const f of fields) {
      if (body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(body[f]);
      }
    }

    const boolFields = [
      "api_key_required", "account_required", "credit_card_required",
      "commercial_use_allowed", "featured"
    ];

    for (const bf of boolFields) {
      if (body[bf] !== undefined) {
        updates.push(`${bf} = ?`);
        values.push(body[bf] ? 1 : 0);
      }
    }

    const jsonFields = ["platforms", "programming_languages", "alternatives"];
    for (const jf of jsonFields) {
      if (body[jf] !== undefined) {
        updates.push(`${jf} = ?`);
        values.push(JSON.stringify(Array.isArray(body[jf]) ? body[jf] : []));
      }
    }

    values.push(params.id);

    db.prepare(`UPDATE resources SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    logAdminAction(session.userId, "update_resource", "resources", params.id, body);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT name FROM resources WHERE id = ?").get(params.id) as { name: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM resources WHERE id = ?").run(params.id);

    logAdminAction(session.userId, "delete_resource", "resources", params.id, { name: existing.name });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import crypto from "node:crypto";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT b.id, b.resource_id, b.notes, b.created_at,
             r.name, r.slug, r.short_description, r.pricing_classification, r.official_website,
             c.name as category_name
      FROM bookmarks b
      JOIN resources r ON b.resource_id = r.id
      JOIN categories c ON r.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(user.id);

    return NextResponse.json({ bookmarks: rows });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in to bookmark resources" }, { status: 401 });
    }

    const body = await req.json();
    const { resource_id, notes } = body;

    if (!resource_id) {
      return NextResponse.json({ error: "resource_id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?")
      .get(user.id, resource_id) as { id: string } | undefined;

    if (existing) {
      // Toggle off
      db.prepare("DELETE FROM bookmarks WHERE id = ?").run(existing.id);
      return NextResponse.json({ bookmarked: false, message: "Bookmark removed" });
    }

    // Check entitlement limits
    const entitlements = getUserEntitlements(user.id);
    const countResult = db
      .prepare("SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?")
      .get(user.id) as { count: number };

    if (countResult.count >= entitlements.maxBookmarks) {
      return NextResponse.json(
        {
          error: `Bookmark limit reached (${countResult.count}/${entitlements.maxBookmarks}). Upgrade your membership for additional bookmark storage.`,
        },
        { status: 403 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO bookmarks (id, user_id, resource_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user.id, resource_id, notes || null, now);

    return NextResponse.json({ bookmarked: true, id, message: "Resource bookmarked" });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

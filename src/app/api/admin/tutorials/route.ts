import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

const authorized = () => {
  const session = getSession();
  return session && session.role === "admin" ? session : null;
};
const json = (value: unknown, fallback: unknown = []) => JSON.stringify(Array.isArray(value) ? value : fallback);

export async function GET(req: NextRequest) {
  const session = authorized();
  if (!session) return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const db = getDb();
  const conditions = ["1 = 1"];
  const params: string[] = [];
  if (search) { conditions.push("(title LIKE ? OR summary LIKE ? OR slug LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status === "published") conditions.push("is_published = 1");
  if (status === "draft") conditions.push("is_published = 0");
  const tutorials = db.prepare(`SELECT id, slug, title, summary, category, difficulty, estimated_minutes, last_verified_date, CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END as publication_status, featured, updated_at FROM tutorials WHERE ${conditions.join(" AND ")} ORDER BY updated_at DESC`).all(...params);
  return NextResponse.json({ tutorials });
}

export async function POST(req: NextRequest) {
  const session = authorized();
  if (!session) return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.title || !body.slug || !body.summary || !body.content || !body.category) {
      return NextResponse.json({ error: "Title, slug, summary, category, and content are required." }, { status: 400 });
    }
    const db = getDb();
    const now = new Date().toISOString();
    const id = body.id || `tutorial-${body.slug}`;
    db.prepare(`INSERT INTO tutorials (
      id, slug, title, summary, category, difficulty, estimated_minutes, prerequisites, supported_os, content,
      troubleshooting_notes, security_warnings, official_docs_url, last_verified_date, is_published, featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?)`).run(
      id, body.slug, body.title, body.summary, body.category, body.difficulty || "beginner",
      Number(body.estimated_minutes) || 15, json(body.prerequisites), json(body.supported_operating_systems),
      body.content, body.official_docs_url || "", body.last_verified_date || "", body.publication_status === "published" ? 1 : 0,
      body.featured ? 1 : 0, now, now
    );
    logAdminAction(session.userId, "create_tutorial", "tutorials", id, { title: body.title });
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create tutorial" }, { status: 400 });
  }
}

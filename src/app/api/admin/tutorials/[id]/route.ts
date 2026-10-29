import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

function guard() {
  const session = getSession();
  return session && session.role === "admin" ? session : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!guard()) return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  const tutorial = getDb().prepare("SELECT * FROM tutorials WHERE id = ?").get(params.id);
  return tutorial ? NextResponse.json({ tutorial }) : NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = guard();
  if (!session) return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  try {
    const body = await req.json();
    const db = getDb();
    if (!db.prepare("SELECT id FROM tutorials WHERE id = ?").get(params.id)) return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    const fields = ["slug", "title", "summary", "category", "difficulty", "estimated_minutes", "content", "troubleshooting_notes", "security_warnings", "official_docs_url", "last_verified_date"];
    const updates = ["updated_at = ?"];
    const values: unknown[] = [new Date().toISOString()];
    for (const field of fields) if (body[field] !== undefined) { updates.push(`${field} = ?`); values.push(field === "estimated_minutes" ? Number(body[field]) : body[field]); }
    if (body.prerequisites !== undefined) { updates.push("prerequisites = ?"); values.push(JSON.stringify(Array.isArray(body.prerequisites) ? body.prerequisites : [])); }
    if (body.supported_operating_systems !== undefined) { updates.push("supported_os = ?"); values.push(JSON.stringify(Array.isArray(body.supported_operating_systems) ? body.supported_operating_systems : [])); }
    if (body.publication_status !== undefined) { updates.push("is_published = ?"); values.push(body.publication_status === "published" ? 1 : 0); }
    if (body.featured !== undefined) { updates.push("featured = ?"); values.push(body.featured ? 1 : 0); }
    values.push(params.id);
    db.prepare(`UPDATE tutorials SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    logAdminAction(session.userId, "update_tutorial", "tutorials", params.id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update tutorial" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = guard();
  if (!session) return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  const result = getDb().prepare("DELETE FROM tutorials WHERE id = ?").run(params.id);
  if (!result.changes) return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  logAdminAction(session.userId, "delete_tutorial", "tutorials", params.id, {});
  return NextResponse.json({ success: true });
}

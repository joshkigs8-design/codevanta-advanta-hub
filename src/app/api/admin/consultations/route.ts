import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  const requests = getDb().prepare(`
    SELECT id, name, email, phone, project_description, status, created_at, updated_at
    FROM consultation_requests
    ORDER BY created_at DESC
    LIMIT 200
  `).all();

  return NextResponse.json({ requests });
}

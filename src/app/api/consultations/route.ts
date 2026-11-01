import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const phone = String(form.get("phone") || "").trim();
    const projectDescription = String(form.get("project_description") || "").trim();

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a name and valid email address." }, { status: 400 });
    }

    const now = new Date().toISOString();
    getDb().prepare(`
      INSERT INTO consultation_requests
        (id, name, email, phone, project_description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'new', ?, ?)
    `).run(crypto.randomUUID(), name, email, phone || null, projectDescription || null, now, now);

    return NextResponse.redirect(new URL("/?consultation=received", req.url), 303);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to submit consultation request." },
      { status: 500 }
    );
  }
}

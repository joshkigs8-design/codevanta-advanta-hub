import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { GuidedProject } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT * FROM guided_projects WHERE is_published = 1 ORDER BY created_at ASC`)
      .all() as Array<Record<string, any>>;

    const projects: GuidedProject[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      difficulty: r.difficulty,
      estimated_hours: r.estimated_hours,
      prerequisites: JSON.parse(r.prerequisites || "[]"),
      tech_stack: JSON.parse(r.tech_stack || "[]"),
      expected_outcomes: r.expected_outcomes,
      content: r.content,
      starter_code_repo_url: r.starter_code_repo_url,
      demo_url: r.demo_url,
      paid_services_warning: r.paid_services_warning,
      is_published: Boolean(r.is_published),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({ projects, total: projects.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}


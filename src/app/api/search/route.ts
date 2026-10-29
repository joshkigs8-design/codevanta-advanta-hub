import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface SearchResultItem {
  id: string;
  type: "tutorial" | "resource" | "learning_path" | "troubleshooting" | "project" | "student_benefit";
  title: string;
  description: string;
  url: string;
  badge?: string;
  metadata?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const db = getDb();
    const pattern = `%${q.toLowerCase()}%`;
    const results: SearchResultItem[] = [];

    // 1. Search Tutorials
    try {
      const tutRows = db
        .prepare(
          `SELECT id, slug, title, summary, category, difficulty FROM tutorials
           WHERE is_published = 1 AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(category) LIKE ?)
           LIMIT 5`
        )
        .all(pattern, pattern, pattern) as Array<Record<string, any>>;

      for (const r of tutRows) {
        results.push({
          id: r.id,
          type: "tutorial",
          title: r.title,
          description: r.summary,
          url: `/tutorials/${r.slug}`,
          badge: r.category,
          metadata: r.difficulty,
        });
      }
    } catch {
      // ignore
    }

    // 2. Search Resources (Developer Tools & APIs)
    try {
      const resRows = db
        .prepare(
          `SELECT id, slug, name, short_description, pricing_classification, category_id FROM resources
           WHERE verification_status = 'verified' AND (LOWER(name) LIKE ? OR LOWER(short_description) LIKE ?)
           LIMIT 6`
        )
        .all(pattern, pattern) as Array<Record<string, any>>;

      for (const r of resRows) {
        results.push({
          id: r.id,
          type: "resource",
          title: r.name,
          description: r.short_description,
          url: `/directory/${r.slug}`,
          badge: r.pricing_classification?.replace(/_/g, " "),
          metadata: r.category_id,
        });
      }
    } catch {
      // ignore
    }

    // 3. Search Learning Paths
    try {
      const pathRows = db
        .prepare(
          `SELECT id, slug, title, description, category, difficulty FROM learning_paths
           WHERE is_published = 1 AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)
           LIMIT 3`
        )
        .all(pattern, pattern) as Array<Record<string, any>>;

      for (const r of pathRows) {
        results.push({
          id: r.id,
          type: "learning_path",
          title: r.title,
          description: r.description,
          url: `/learning-paths#${r.slug}`,
          badge: r.category,
          metadata: r.difficulty,
        });
      }
    } catch {
      // ignore
    }

    // 4. Search Troubleshooting
    try {
      const troubleRows = db
        .prepare(
          `SELECT id, slug, error_message, affected_tool, category FROM troubleshooting_entries
           WHERE is_published = 1 AND (LOWER(error_message) LIKE ? OR LOWER(affected_tool) LIKE ? OR LOWER(likely_causes) LIKE ?)
           LIMIT 4`
        )
        .all(pattern, pattern, pattern) as Array<Record<string, any>>;

      for (const r of troubleRows) {
        results.push({
          id: r.id,
          type: "troubleshooting",
          title: `${r.affected_tool}: ${r.error_message}`,
          description: `Diagnostic and step-by-step resolution for ${r.category}`,
          url: `/troubleshooting`,
          badge: "Troubleshooting",
          metadata: r.affected_tool,
        });
      }
    } catch {
      // ignore
    }

    // 5. Search Guided Projects
    try {
      const projRows = db
        .prepare(
          `SELECT id, slug, title, summary, difficulty FROM guided_projects
           WHERE is_published = 1 AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ?)
           LIMIT 3`
        )
        .all(pattern, pattern) as Array<Record<string, any>>;

      for (const r of projRows) {
        results.push({
          id: r.id,
          type: "project",
          title: r.title,
          description: r.summary,
          url: `/projects`,
          badge: "Guided Project",
          metadata: r.difficulty,
        });
      }
    } catch {
      // ignore
    }

    // 6. Search Student Benefits
    try {
      const studRows = db
        .prepare(
          `SELECT id, slug, title, provider, description FROM student_benefits
           WHERE is_active = 1 AND (LOWER(title) LIKE ? OR LOWER(provider) LIKE ? OR LOWER(description) LIKE ?)
           LIMIT 3`
        )
        .all(pattern, pattern, pattern) as Array<Record<string, any>>;

      for (const r of studRows) {
        results.push({
          id: r.id,
          type: "student_benefit",
          title: `${r.title} (${r.provider})`,
          description: r.description,
          url: `/students`,
          badge: "Student Benefit",
          metadata: r.provider,
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ results, total: results.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}


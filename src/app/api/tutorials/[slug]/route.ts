import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import { Tutorial } from "@/types";

export const dynamic = "force-dynamic";

function getPreviewContent(content: string): string {
  // Cut before Section 2 or Section 3 so visitors get an informative preview
  const sectionMatch = content.match(/\n## (?:2|3)\./);
  if (sectionMatch && typeof sectionMatch.index === "number" && sectionMatch.index > 300) {
    return content.slice(0, sectionMatch.index).trim();
  }
  // Fallback: Take up to ~1,200 characters at paragraph boundary
  if (content.length <= 1200) return content;
  const slice = content.slice(0, 1200);
  const lastDoubleNewline = slice.lastIndexOf("\n\n");
  return lastDoubleNewline > 400 ? slice.slice(0, lastDoubleNewline).trim() : slice;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const db = getDb();

    const row = db
      .prepare(`SELECT * FROM tutorials WHERE slug = ? AND is_published = 1`)
      .get(slug) as Record<string, any> | undefined;

    if (!row) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    const user = getCurrentUser();
    const entitlements = getUserEntitlements(user ? user.id : null);
    const isMember = entitlements.planSlug !== "free";

    // Non-members get preview content; members get full technical content
    const isLocked = !isMember;

    const tutorial: Tutorial & { is_locked?: boolean; is_preview?: boolean } = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      category: row.category,
      difficulty: row.difficulty,
      estimated_minutes: row.estimated_minutes,
      prerequisites: JSON.parse(row.prerequisites || "[]"),
      supported_os: JSON.parse(row.supported_os || "[]"),
      content: isLocked ? getPreviewContent(row.content) : row.content,
      troubleshooting_notes: isLocked
        ? "Detailed troubleshooting runbooks, terminal error codes, and configuration fixes are reserved for CodeVanta Members."
        : row.troubleshooting_notes,
      security_warnings: isLocked
        ? "Network security constraints, proxy binding rules, and cost prevention guardrails are reserved for CodeVanta Members."
        : row.security_warnings,
      official_docs_url: row.official_docs_url,
      last_verified_date: row.last_verified_date,
      is_published: Boolean(row.is_published),
      featured: Boolean(row.featured),
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_locked: isLocked,
      is_preview: isLocked,
    };

    // Get related tutorials in the same category
    const relatedRows = db
      .prepare(
        `SELECT id, slug, title, summary, category, difficulty, estimated_minutes
         FROM tutorials
         WHERE category = ? AND id != ? AND is_published = 1
         LIMIT 3`
      )
      .all(tutorial.category, tutorial.id) as Array<Record<string, any>>;

    return NextResponse.json({
      tutorial,
      related: relatedRows,
      authenticated: Boolean(user),
      isMember,
      planSlug: entitlements.planSlug,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

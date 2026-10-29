import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

const parse = (value: unknown) => {
  try { return JSON.parse(String(value || "[]")); } catch { return []; }
};

function getPreviewContent(content: string): string {
  const sectionMatch = content.match(/\n## (?:2|3)\./);
  if (sectionMatch && typeof sectionMatch.index === "number" && sectionMatch.index > 300) {
    return content.slice(0, sectionMatch.index).trim();
  }
  if (content.length <= 1200) return content;
  const slice = content.slice(0, 1200);
  const lastDoubleNewline = slice.lastIndexOf("\n\n");
  return lastDoubleNewline > 400 ? slice.slice(0, lastDoubleNewline).trim() : slice;
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const db = getDb();
    const guide = db.prepare(
      `SELECT * FROM tutorials WHERE slug = ? AND is_published = 1`
    ).get(params.slug) as Record<string, any> | undefined;

    if (!guide) return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });

    const user = getCurrentUser();
    const entitlements = getUserEntitlements(user ? user.id : null);
    const isMember = entitlements.planSlug !== "free";
    const isLocked = !isMember;

    const related = db.prepare(
      `SELECT slug, title, summary, category, estimated_minutes FROM tutorials
       WHERE is_published = 1 AND slug != ? AND category = ?
       ORDER BY featured DESC, last_verified_date DESC LIMIT 3`
    ).all(params.slug, guide.category);

    return NextResponse.json({
      tutorial: {
        ...guide,
        content: isLocked ? getPreviewContent(guide.content || "") : guide.content,
        is_published: Boolean(guide.is_published),
        featured: Boolean(guide.featured),
        is_locked: isLocked,
        is_preview: isLocked,
        prerequisites: parse(guide.prerequisites),
        supported_operating_systems: parse(guide.supported_os),
        steps: [],
        references: guide.official_docs_url ? [{ title: "Official documentation", url: guide.official_docs_url }] : [],
        introduction: guide.summary,
      },
      related,
      authenticated: Boolean(user),
      isMember,
      planSlug: entitlements.planSlug,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

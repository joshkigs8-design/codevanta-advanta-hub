import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import { GuidedProject } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    const entitlements = getUserEntitlements(user ? user.id : null);
    const isEntitled = entitlements.canAccessOriginalBlueprints;

    const db = getDb();
    const rows = db
      .prepare(`SELECT * FROM guided_projects WHERE is_published = 1 ORDER BY created_at ASC`)
      .all() as Array<Record<string, any>>;

    const projects: Array<GuidedProject & { is_locked?: boolean; lock_reason?: string }> = rows.map((r, index) => {
      // First beginner project previewable; advanced/intermediate projects locked behind paywall
      const isLocked = !isEntitled && index > 0;

      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        difficulty: r.difficulty,
        estimated_hours: r.estimated_hours,
        prerequisites: JSON.parse(r.prerequisites || "[]"),
        tech_stack: JSON.parse(r.tech_stack || "[]"),
        expected_outcomes: r.expected_outcomes,
        content: isLocked ? "" : r.content,
        starter_code_repo_url: isLocked ? "" : r.starter_code_repo_url,
        demo_url: isLocked ? "" : r.demo_url,
        paid_services_warning: r.paid_services_warning,
        is_published: Boolean(r.is_published),
        created_at: r.created_at,
        updated_at: r.updated_at,
        is_locked: isLocked,
        lock_reason: isLocked
          ? "Upgrade to Pro or VIP to clone the starter repo and view step-by-step production blueprints."
          : undefined,
      };
    });

    return NextResponse.json({
      projects,
      total: projects.length,
      authenticated: Boolean(user),
      isEntitled,
      planSlug: entitlements.planSlug,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

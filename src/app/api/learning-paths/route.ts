import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import { LearningPath } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    const entitlements = getUserEntitlements(user ? user.id : null);
    const isEntitled = entitlements.canAccessLearningPaths;

    const db = getDb();
    const rows = db
      .prepare(`SELECT * FROM learning_paths WHERE is_published = 1 ORDER BY display_order ASC`)
      .all() as LearningPath[];

    const paths = rows.map((p, index) => {
      // First track is previewable; remaining tracks are locked for non-members
      const isLocked = !isEntitled && index > 0;
      return {
        ...p,
        is_locked: isLocked,
        lock_reason: isLocked
          ? "Upgrade to Pro or VIP to unlock the complete structured learning track and progress tracking."
          : undefined,
      };
    });

    return NextResponse.json({
      paths,
      total: paths.length,
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

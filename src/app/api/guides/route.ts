import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import { LearningGuide } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = getCurrentUser();
    const isAuthenticated = Boolean(user);
    const entitlements = getUserEntitlements(user ? user.id : null);
    const db = getDb();

    const guides = db
      .prepare(`SELECT * FROM learning_guides WHERE is_published = 1 ORDER BY created_at ASC`)
      .all() as LearningGuide[];

    // Enforce server-side paywall gating on guide content & starter kit URLs
    const sanitizedGuides = guides.map((guide) => {
      // Guests who are not signed in have all blueprint content locked
      if (!isAuthenticated) {
        return {
          ...guide,
          content: "",
          starter_kit_download_url: null,
          is_locked: true,
          lock_reason: "Sign in or create a free account to unlock this guide and download production starter kits.",
        };
      }

      const isFree = guide.min_plan_tier === "free";
      const hasAccess =
        isFree ||
        (guide.min_plan_tier === "basic" &&
          (entitlements.planSlug === "basic" ||
            entitlements.planSlug === "pro" ||
            entitlements.planSlug === "vip")) ||
        (guide.min_plan_tier === "pro" &&
          (entitlements.planSlug === "pro" || entitlements.planSlug === "vip")) ||
        (guide.min_plan_tier === "vip" && entitlements.planSlug === "vip");

      if (hasAccess) {
        return guide;
      }

      // Redact full content and starter kit download if user has not unlocked this tier
      return {
        ...guide,
        content: "",
        starter_kit_download_url: null,
        is_locked: true,
        lock_reason: `Upgrade to ${guide.min_plan_tier.toUpperCase()} plan to access this architecture blueprint.`,
      };
    });

    return NextResponse.json({
      guides: sanitizedGuides,
      authenticated: isAuthenticated,
      entitlements,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

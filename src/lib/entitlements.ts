import { getDb } from "./db";
import { Membership, PlanSlug } from "@/types";

export interface UserEntitlements {
  planSlug: PlanSlug | "free";
  planName: string;
  canAccessBasicDirectory: boolean;
  canUseAdvancedSearch: boolean;
  canAccessCuratedCollections: boolean;
  canAccessLearningPaths: boolean;
  canAccessOriginalBlueprints: boolean;
  canDownloadStarterKits: boolean;
  canAccessEarlyReleases: boolean;
  maxBookmarks: number;
}

export function getUserEntitlements(userId?: string | null): UserEntitlements {
  const freeDefaults: UserEntitlements = {
    planSlug: "free",
    planName: "Public Explorer",
    canAccessBasicDirectory: true,
    canUseAdvancedSearch: false,
    canAccessCuratedCollections: false,
    canAccessLearningPaths: false,
    canAccessOriginalBlueprints: false,
    canDownloadStarterKits: false,
    canAccessEarlyReleases: false,
    maxBookmarks: 3,
  };

  if (!userId) return freeDefaults;

  const db = getDb();
  const membership = db
    .prepare("SELECT * FROM memberships WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1")
    .get(userId) as Membership | undefined;

  if (!membership) return freeDefaults;

  const plan = db
    .prepare("SELECT entitlements FROM membership_plans WHERE slug = ?")
    .get(membership.plan_slug) as { entitlements: string } | undefined;

  if (!plan) return freeDefaults;

  try {
    const rawEntitlements = JSON.parse(plan.entitlements);
    return {
      planSlug: membership.plan_slug,
      planName: membership.plan_name,
      canAccessBasicDirectory: true,
      canUseAdvancedSearch: !!rawEntitlements.can_use_advanced_search,
      canAccessCuratedCollections: !!rawEntitlements.can_access_curated_collections,
      canAccessLearningPaths: !!rawEntitlements.can_access_learning_paths,
      canAccessOriginalBlueprints: !!rawEntitlements.can_access_original_blueprints,
      canDownloadStarterKits: !!rawEntitlements.can_download_starter_kits,
      canAccessEarlyReleases: !!rawEntitlements.can_access_early_releases,
      maxBookmarks: rawEntitlements.max_bookmarks || 10,
    };
  } catch {
    return freeDefaults;
  }
}

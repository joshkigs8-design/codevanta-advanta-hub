import crypto from "node:crypto";

export interface NormalizedSyncUser {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "member" | "admin";
  emailVerified: number;
  referralCode?: string | null;
  referredBy?: string | null;
  planSlug?: string | null;
  planName?: string | null;
  membershipReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function normalizeUser(doc: any, nowIso: string): NormalizedSyncUser | null {
  if (!doc || typeof doc !== "object") return null;

  // Check if REST document format (has .fields)
  const isRest = Boolean(doc.fields && typeof doc.fields === "object");
  const f = isRest ? doc.fields : doc;

  const rawEmail = (isRest ? f.email?.stringValue : (doc.email || doc.emailAddress)) || "";
  const email = String(rawEmail).toLowerCase().trim();
  if (!email || !email.includes("@")) return null;

  const rawUid = isRest
    ? (f.uid?.stringValue || doc.name?.split("/").pop())
    : (doc.uid || doc.id || doc.userId);
  const id = String(rawUid || crypto.randomUUID());

  const rawFullName = isRest
    ? (f.displayName?.stringValue || f.fullName?.stringValue)
    : (doc.displayName || doc.fullName || doc.name);
  const fullName = String(rawFullName || email.split("@")[0] || "User").trim();

  const rawRole = isRest ? f.role?.stringValue : doc.role;
  let role: "user" | "member" | "admin" = "user";
  if (email === "joshkigs8@gmail.com" || rawRole === "admin") {
    role = "admin";
  } else if (rawRole === "member") {
    role = "member";
  }

  const rawEmailVerified = isRest ? f.emailVerified?.booleanValue : doc.emailVerified;
  const emailVerified = Boolean(rawEmailVerified || email === "joshkigs8@gmail.com") ? 1 : 0;

  const referralCode = isRest ? f.referralCode?.stringValue : (doc.referralCode || doc.referral_code);
  const referredBy = isRest ? f.referredBy?.stringValue : (doc.referredBy || doc.referred_by);

  const planSlug = isRest ? f.planId?.stringValue : (doc.planId || doc.plan_slug);
  const planName = isRest ? f.planName?.stringValue : (doc.planName || doc.plan_name);
  const rawMembershipRef = isRest
    ? f.membershipReference?.stringValue
    : (doc.membershipReference || doc.membership_reference);
  const membershipReference = rawMembershipRef ? String(rawMembershipRef).trim() : null;

  let createdAt = nowIso;
  if (isRest) {
    createdAt = f.createdAt?.timestampValue || f.createdAt?.stringValue || doc.createTime || nowIso;
  } else if (doc.createdAt) {
    if (typeof doc.createdAt === "string") createdAt = doc.createdAt;
    else if (doc.createdAt.toDate && typeof doc.createdAt.toDate === "function") {
      try { createdAt = doc.createdAt.toDate().toISOString(); } catch { createdAt = nowIso; }
    } else if (doc.createdAt.seconds) {
      createdAt = new Date(doc.createdAt.seconds * 1000).toISOString();
    }
  }

  let updatedAt = nowIso;
  if (isRest) {
    updatedAt = f.updatedAt?.timestampValue || f.updatedAt?.stringValue || doc.updateTime || nowIso;
  } else if (doc.updatedAt) {
    if (typeof doc.updatedAt === "string") updatedAt = doc.updatedAt;
    else if (doc.updatedAt.toDate && typeof doc.updatedAt.toDate === "function") {
      try { updatedAt = doc.updatedAt.toDate().toISOString(); } catch { updatedAt = nowIso; }
    } else if (doc.updatedAt.seconds) {
      updatedAt = new Date(doc.updatedAt.seconds * 1000).toISOString();
    }
  }

  return {
    id,
    email,
    fullName,
    role,
    emailVerified,
    referralCode: referralCode ? String(referralCode).trim() : null,
    referredBy: referredBy ? String(referredBy).trim() : null,
    planSlug: planSlug ? String(planSlug).trim() : null,
    planName: planName ? String(planName).trim() : null,
    membershipReference,
    createdAt,
    updatedAt,
  };
}

/**
 * Upsert an array of user objects (from Firestore Web SDK or REST API) into the SQLite database.
 */
export function syncUsersToDb(db: any, rawUsers: any[]): number {
  if (!Array.isArray(rawUsers) || rawUsers.length === 0) return 0;
  const nowIso = new Date().toISOString();

  const upsertProfile = db.prepare(`
    INSERT INTO profiles (id, email, password_hash, full_name, role, country, email_verified, created_at, updated_at)
    VALUES (?, ?, 'FIREBASE_AUTH', ?, ?, 'KE', ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      full_name = excluded.full_name,
      role = CASE WHEN profiles.role = 'admin' THEN 'admin' ELSE excluded.role END,
      email_verified = CASE WHEN profiles.email_verified = 1 THEN 1 ELSE excluded.email_verified END,
      updated_at = excluded.updated_at
  `);

  const upsertRefCode = db.prepare(`
    INSERT INTO referral_codes (id, user_id, code, clicks, created_at)
    VALUES (?, ?, ?, 0, ?)
    ON CONFLICT(user_id) DO UPDATE SET code = excluded.code
  `);

  const upsertMembership = db.prepare(`
    INSERT INTO memberships (
      id, user_id, plan_id, plan_slug, plan_name, status,
      amount_paid_kes, starts_at, expires_at, payment_reference, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      plan_id = excluded.plan_id,
      plan_slug = excluded.plan_slug,
      plan_name = excluded.plan_name,
      status = excluded.status,
      updated_at = excluded.updated_at
  `);

  let count = 0;
  for (const raw of rawUsers) {
    const user = normalizeUser(raw, nowIso);
    if (!user) continue;

    try {
      upsertProfile.run(
        user.id,
        user.email,
        user.fullName,
        user.role,
        user.emailVerified,
        user.createdAt,
        user.updatedAt
      );
      count++;

      // Upsert referral code if available
      if (user.referralCode) {
        try {
          upsertRefCode.run(`ref-${user.id}`, user.id, user.referralCode, user.createdAt);
        } catch {
          // In case of conflict with another record
        }
      }

      // Upsert referral attribution if referredBy is available
      if (user.referredBy) {
        try {
          const referrerRow = db
            .prepare("SELECT user_id FROM referral_codes WHERE code = ?")
            .get(user.referredBy.toUpperCase()) as { user_id: string } | undefined;
          if (referrerRow && referrerRow.user_id !== user.id) {
            db.prepare(`
              INSERT INTO referral_attributions (
                id, referral_code, referrer_user_id, referred_user_id, status, created_at
              ) VALUES (?, ?, ?, ?, 'attributed', ?)
              ON CONFLICT(referred_user_id) DO NOTHING
            `).run(`attr-${user.id}`, user.referredBy.toUpperCase(), referrerRow.user_id, user.id, user.createdAt);
          }
        } catch {
          // ignore
        }
      }

      // Rehydrate active membership if plan is set
      if (user.planSlug && user.planSlug !== "free") {
        const plan = db
          .prepare("SELECT id, name FROM membership_plans WHERE slug = ?")
          .get(user.planSlug) as { id: string; name: string } | undefined;
        if (plan) {
          const membershipId = `mem-fs-${user.id}`;
          const planName = user.planName || plan.name;
          const ref = user.membershipReference || "FIRESTORE_SYNC";
          try {
            upsertMembership.run(
              membershipId,
              user.id,
              plan.id,
              user.planSlug,
              planName,
              user.createdAt,
              null,
              ref,
              user.createdAt,
              user.updatedAt
            );
          } catch {
            // ignore
          }

          // If membership was activated via promo code (PROMO_...), rehydrate promo redemptions & count!
          if (ref.startsWith("PROMO_")) {
            const codeStr = ref.replace("PROMO_", "").trim().toUpperCase();
            try {
              let promo = db.prepare("SELECT id FROM promo_codes WHERE code = ?").get(codeStr) as { id: string } | undefined;
              if (!promo) {
                const newPromoId = `promo_${crypto.randomUUID()}`;
                db.prepare(`
                  INSERT INTO promo_codes (id, code, description, plan_slug, max_uses, used_count, is_active, created_by, created_at, updated_at)
                  VALUES (?, ?, ?, ?, 10, 0, 1, 'system_rehydrate', ?, ?)
                `).run(newPromoId, codeStr, `Promo Pass (${codeStr})`, user.planSlug, user.createdAt, user.updatedAt);
                promo = { id: newPromoId };
              }

              db.prepare(`
                INSERT INTO promo_code_redemptions (id, promo_code_id, promo_code, user_id, user_email, plan_slug, redeemed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(promo_code_id, user_id) DO NOTHING
              `).run(
                `red-${promo.id}-${user.id}`,
                promo.id,
                codeStr,
                user.id,
                user.email,
                user.planSlug,
                user.createdAt
              );

              db.prepare(`
                UPDATE promo_codes
                SET used_count = (SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = promo_codes.id)
                WHERE id = ?
              `).run(promo.id);
            } catch (pErr) {
              console.warn("Failed to rehydrate promo redemption for user:", user.email, pErr);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to upsert user into SQLite:", user.email, e);
    }
  }

  // Ensure all promo codes have their used_count accurately calculated
  try {
    db.prepare(`
      UPDATE promo_codes
      SET used_count = (SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = promo_codes.id)
    `).run();
  } catch {
    // ignore
  }

  return count;
}

/**
 * Fetch users from Firestore REST API using an authenticated admin ID token and upsert them to SQLite.
 */
export async function fetchAndSyncFirestoreUsers(db: any, idToken?: string): Promise<number> {
  const token = idToken?.trim();
  if (!token) return 0;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codevanta-hub";
  let totalSynced = 0;
  let pageToken: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 20;

  try {
    do {
      pageCount++;
      const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`);
      url.searchParams.set("pageSize", "100");
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        break;
      }

      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        totalSynced += syncUsersToDb(db, data.documents);
      }

      pageToken = typeof data.nextPageToken === "string" && data.nextPageToken.trim() ? data.nextPageToken.trim() : undefined;
    } while (pageToken && pageCount < maxPages);

    return totalSynced;
  } catch (err) {
    console.warn("Could not fetch and sync Firestore users:", err);
    return totalSynced;
  }
}

/**
 * Fetch promo redemptions from Firestore REST API and upsert them to SQLite.
 */
export async function fetchAndSyncFirestorePromoRedemptions(db: any, idToken?: string): Promise<number> {
  const token = idToken?.trim();
  if (!token) return 0;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codevanta-hub";
  let count = 0;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/promo_redemptions?pageSize=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return 0;

    for (const doc of data.documents) {
      const f = doc.fields || {};
      const redemptionId = f.id?.stringValue || doc.name?.split("/").pop();
      const promoCodeStr = (f.promoCode?.stringValue || f.code?.stringValue || "").trim().toUpperCase();
      const userId = f.userId?.stringValue || f.user_id?.stringValue;
      const userEmail = f.email?.stringValue || f.userEmail?.stringValue || "";
      const planSlug = f.planSlug?.stringValue || "vip";
      const redeemedAt = f.redeemedAt?.timestampValue || f.redeemedAt?.stringValue || doc.createTime || new Date().toISOString();

      if (!promoCodeStr || !userId) continue;

      let promo = db.prepare("SELECT id FROM promo_codes WHERE code = ?").get(promoCodeStr) as { id: string } | undefined;
      if (!promo) {
        const newPromoId = `promo_${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO promo_codes (id, code, description, plan_slug, max_uses, used_count, is_active, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, 10, 0, 1, 'system_rehydrate', ?, ?)
        `).run(newPromoId, promoCodeStr, `Promo Pass (${promoCodeStr})`, planSlug, redeemedAt, redeemedAt);
        promo = { id: newPromoId };
      }

      try {
        db.prepare(`
          INSERT INTO promo_code_redemptions (id, promo_code_id, promo_code, user_id, user_email, plan_slug, redeemed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(promo_code_id, user_id) DO NOTHING
        `).run(
          redemptionId,
          promo.id,
          promoCodeStr,
          userId,
          userEmail,
          planSlug,
          redeemedAt
        );
        count++;
      } catch {
        // ignore duplicate
      }
    }

    db.prepare(`
      UPDATE promo_codes
      SET used_count = (SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = promo_codes.id)
    `).run();

    return count;
  } catch (err) {
    console.warn("Could not fetch and sync Firestore promo redemptions:", err);
    return count;
  }
}

/**
 * Main sync entry point for admin API routes.
 */
export async function syncFirestoreUsersToLocal(db: any, idToken?: string): Promise<number> {
  const usersSynced = await fetchAndSyncFirestoreUsers(db, idToken);
  await fetchAndSyncFirestorePromoRedemptions(db, idToken);
  return usersSynced;
}


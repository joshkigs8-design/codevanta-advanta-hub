import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isFirebaseConfigured, firestore } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { verifyFirebaseIdToken } from "@/lib/verifyFirebaseToken";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in or register to redeem your promo code." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Please enter a valid promo code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const db = getDb();

    // 1. Find promo code
    const promo = db
      .prepare("SELECT * FROM promo_codes WHERE code = ?")
      .get(cleanCode) as any;

    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code. Please check and try again." }, { status: 404 });
    }

    // 2. Check active status
    if (!promo.is_active) {
      return NextResponse.json(
        { error: "This promo code is currently disabled or no longer active." },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (promo.expires_at) {
      const now = new Date();
      const expiry = new Date(promo.expires_at);
      if (now > expiry) {
        return NextResponse.json(
          { error: "This launchday promo code has expired." },
          { status: 400 }
        );
      }
    }

    // 4. Check capacity / usage limit
    if (promo.used_count >= promo.max_uses) {
      return NextResponse.json(
        {
          error: `This launchday promo code has reached its maximum capacity (${promo.max_uses}/${promo.max_uses} claimed).`,
        },
        { status: 400 }
      );
    }

    // 5. Check if user has already redeemed this specific code
    const alreadyRedeemed = db
      .prepare("SELECT id FROM promo_code_redemptions WHERE promo_code_id = ? AND user_id = ?")
      .get(promo.id, user.id);

    if (alreadyRedeemed) {
      return NextResponse.json(
        { error: "You have already redeemed this promo code on your account." },
        { status: 400 }
      );
    }

    // 6. Find target membership plan
    const plan = db
      .prepare("SELECT id, name, slug FROM membership_plans WHERE slug = ?")
      .get(promo.plan_slug) as any;

    if (!plan) {
      return NextResponse.json(
        { error: "The membership plan associated with this code was not found." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    let verifiedUid = user.id;

    if (bearerToken) {
      try {
        const verified = await verifyFirebaseIdToken(bearerToken);
        if (verified?.uid) {
          verifiedUid = verified.uid;
        }
      } catch {
        // ignore
      }
    }

    const nowIso = new Date().toISOString();
    const redemptionId = `red_${crypto.randomUUID()}`;
    const membershipId = `mem_promo_${crypto.randomUUID()}`;

    // 7. Atomic transaction: Verify slots under write lock, increment count, and grant membership
    db.exec("BEGIN IMMEDIATE;");
    try {
      // Re-verify promo availability under write lock
      const currentPromo = db
        .prepare("SELECT id, max_uses, used_count, is_active FROM promo_codes WHERE id = ?")
        .get(promo.id) as { id: string; max_uses: number; used_count: number; is_active: number } | undefined;

      if (!currentPromo || currentPromo.is_active !== 1 || currentPromo.used_count >= currentPromo.max_uses) {
        db.exec("ROLLBACK;");
        return NextResponse.json(
          { error: "This launchday promo code has reached its maximum capacity." },
          { status: 400 }
        );
      }

      // Re-check redemption under write lock
      const txAlreadyRedeemed = db
        .prepare("SELECT id FROM promo_code_redemptions WHERE promo_code_id = ? AND (user_id = ? OR user_id = ?)")
        .get(promo.id, user.id, verifiedUid);

      if (txAlreadyRedeemed) {
        db.exec("ROLLBACK;");
        return NextResponse.json(
          { error: "You have already redeemed this promo code on your account." },
          { status: 400 }
        );
      }

      // Atomic slot consumption guard
      const updateResult = db
        .prepare("UPDATE promo_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ? AND used_count < max_uses AND is_active = 1")
        .run(nowIso, promo.id);

      if (updateResult.changes === 0) {
        db.exec("ROLLBACK;");
        return NextResponse.json(
          { error: "This launchday promo code has reached its maximum capacity." },
          { status: 400 }
        );
      }

      // Insert redemption record
      db.prepare(`
        INSERT INTO promo_code_redemptions (
          id, promo_code_id, promo_code, user_id, user_email, plan_slug, redeemed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        redemptionId,
        promo.id,
        promo.code,
        user.id,
        user.email,
        promo.plan_slug,
        nowIso
      );

      // Cancel any older active memberships for clean upgrade
      db.prepare(`
        UPDATE memberships
        SET status = 'cancelled', updated_at = ?
        WHERE (user_id = ? OR user_id = ?) AND status = 'active'
      `).run(nowIso, user.id, verifiedUid);

      // Insert new lifetime active membership for user.id
      db.prepare(`
        INSERT INTO memberships (
          id, user_id, plan_id, plan_slug, plan_name, status,
          amount_paid_kes, starts_at, expires_at, payment_reference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', 0, ?, NULL, ?, ?, ?)
      `).run(
        membershipId,
        user.id,
        plan.id,
        plan.slug,
        plan.name,
        nowIso,
        `PROMO_${promo.code}`,
        nowIso,
        nowIso
      );

      // Also insert for verifiedUid if different from user.id
      if (verifiedUid !== user.id) {
        try {
          db.prepare(`
            INSERT INTO memberships (
              id, user_id, plan_id, plan_slug, plan_name, status,
              amount_paid_kes, starts_at, expires_at, payment_reference, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'active', 0, ?, NULL, ?, ?, ?)
          `).run(
            `mem_promo_uid_${crypto.randomUUID()}`,
            verifiedUid,
            plan.id,
            plan.slug,
            plan.name,
            nowIso,
            `PROMO_${promo.code}`,
            nowIso,
            nowIso
          );
        } catch {
          // ignore
        }
      }

      // Upgrade user profile role if currently regular user
      if (user.role === "user") {
        db.prepare(`
          UPDATE profiles
          SET role = 'member', updated_at = ?
          WHERE id = ? OR id = ?
        `).run(nowIso, user.id, verifiedUid);
      }

      db.exec("COMMIT;");
    } catch (txErr) {
      try {
        db.exec("ROLLBACK;");
      } catch {}
      throw txErr;
    }

    // 8. Synchronize to Firestore REST API if bearerToken is present
    if (bearerToken) {
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codevanta-hub";
        const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${verifiedUid}?updateMask.fieldPaths=planId&updateMask.fieldPaths=planName&updateMask.fieldPaths=role&updateMask.fieldPaths=membershipStatus&updateMask.fieldPaths=membershipReference`;
        await fetch(patchUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify({
            fields: {
              planId: { stringValue: promo.plan_slug },
              planName: { stringValue: plan.name },
              role: { stringValue: user.role === "admin" ? "admin" : "member" },
              membershipStatus: { stringValue: "active" },
              membershipReference: { stringValue: `PROMO_${promo.code}` },
            },
          }),
        });

        // Record in Firestore promo_redemptions collection (allowed by firestore.rules for authenticated owner)
        const redemptionDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/promo_redemptions?documentId=${redemptionId}`;
        await fetch(redemptionDocUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify({
            fields: {
              id: { stringValue: redemptionId },
              userId: { stringValue: verifiedUid },
              email: { stringValue: user.email },
              promoCode: { stringValue: promo.code },
              planSlug: { stringValue: promo.plan_slug },
              redeemedAt: { timestampValue: nowIso },
            },
          }),
        });
      } catch (err) {
        console.warn("Firestore promo REST sync notice:", err);
      }
    }

    // Also attempt client SDK setDoc
    if (isFirebaseConfigured() && firestore) {
      try {
        const userRef = doc(firestore, "users", verifiedUid);
        await setDoc(
          userRef,
          {
            planId: promo.plan_slug,
            planName: plan.name,
            role: user.role === "admin" ? "admin" : "member",
            membershipId,
            membershipStatus: "active",
            membershipStartsAt: nowIso,
            membershipExpiresAt: null,
            membershipReference: `PROMO_${promo.code}`,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        const redRef = doc(firestore, "promo_redemptions", redemptionId);
        await setDoc(redRef, {
          id: redemptionId,
          userId: verifiedUid,
          email: user.email,
          promoCode: promo.code,
          planSlug: promo.plan_slug,
          redeemedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.warn("Firestore promo sync notice:", fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Success! Code ${promo.code} redeemed. You now have full ${plan.name} access!`,
      planSlug: plan.slug,
      planName: plan.name,
      remainingSlots: promo.max_uses - (promo.used_count + 1),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}


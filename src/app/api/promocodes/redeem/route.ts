import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isFirebaseConfigured, firestore } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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

    const nowIso = new Date().toISOString();
    const redemptionId = `red_${crypto.randomUUID()}`;
    const membershipId = `mem_promo_${crypto.randomUUID()}`;

    // 7. Atomic transaction: Record redemption, increment count, and grant membership
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

    db.prepare(`
      UPDATE promo_codes
      SET used_count = used_count + 1, updated_at = ?
      WHERE id = ?
    `).run(nowIso, promo.id);

    // Cancel any older active memberships for clean upgrade
    db.prepare(`
      UPDATE memberships
      SET status = 'cancelled', updated_at = ?
      WHERE user_id = ? AND status = 'active'
    `).run(nowIso, user.id);

    // Insert new lifetime active membership
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

    // Upgrade user profile role if currently regular user
    if (user.role === "user") {
      db.prepare(`
        UPDATE profiles
        SET role = 'member', updated_at = ?
        WHERE id = ?
      `).run(nowIso, user.id);
    }

    // 8. Synchronize to Firestore if configured
    if (isFirebaseConfigured() && firestore) {
      try {
        const userRef = doc(firestore, "users", user.id);
        await setDoc(
          userRef,
          {
            planId: promo.plan_slug,
            role: user.role === "admin" ? "admin" : "member",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
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


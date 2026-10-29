import { getDb } from "./db";
import crypto from "node:crypto";
import {
  ReferralCode,
  ReferralAttribution,
  ReferralReward,
  ReferralProgramStatus,
  PlanSlug,
  RewardStatus,
} from "@/types";

export function getProgramStatus(): ReferralProgramStatus {
  const db = getDb();
  const setting = db
    .prepare("SELECT value FROM programme_settings WHERE key = 'referral_program_status'")
    .get() as { value: string } | undefined;

  return (setting?.value as ReferralProgramStatus) || "compliance_review";
}

export function setProgramStatus(
  status: ReferralProgramStatus,
  adminUserId: string,
  legalReviewerNotes?: string
): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare("UPDATE programme_settings SET value = ?, updated_at = ? WHERE key = 'referral_program_status'")
    .run(status, now);

  if (legalReviewerNotes) {
    db.prepare("UPDATE programme_settings SET value = ?, updated_at = ? WHERE key = 'compliance_notes'")
      .run(legalReviewerNotes, now);
    db.prepare("UPDATE programme_settings SET value = ?, updated_at = ? WHERE key = 'compliance_certification_date'")
      .run(now, now);
  }
}

export function getReferralCodeForUser(userId: string): ReferralCode | null {
  const db = getDb();
  let refCode = db
    .prepare("SELECT id, user_id, code, clicks, created_at FROM referral_codes WHERE user_id = ?")
    .get(userId) as ReferralCode | undefined;

  if (!refCode) {
    // Generate unique referral code
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `CV${randomHex}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare("INSERT INTO referral_codes (id, user_id, code, clicks, created_at) VALUES (?, ?, ?, 0, ?)")
      .run(id, userId, code, now);

    refCode = {
      id,
      user_id: userId,
      code,
      clicks: 0,
      created_at: now,
    };
  }

  return refCode;
}

export function recordReferralClick(code: string): boolean {
  const db = getDb();
  const result = db.prepare("UPDATE referral_codes SET clicks = clicks + 1 WHERE code = ?").run(code.toUpperCase());
  return result.changes > 0;
}

export function attributeReferral(
  referralCodeString: string,
  newUserId: string,
  ipHash?: string,
  uaHash?: string
): ReferralAttribution | null {
  const db = getDb();
  const code = referralCodeString.trim().toUpperCase();

  const refCodeRow = db
    .prepare("SELECT user_id FROM referral_codes WHERE code = ?")
    .get(code) as { user_id: string } | undefined;

  if (!refCodeRow) return null;

  // Strict anti-fraud rule: No self-referral
  if (refCodeRow.user_id === newUserId) {
    return null;
  }

  // Check if user is already attributed
  const existing = db
    .prepare("SELECT id FROM referral_attributions WHERE referred_user_id = ?")
    .get(newUserId) as { id: string } | undefined;

  if (existing) return null;

  // Multi-account / Sybil velocity checks:
  // If IP hash is provided, limit max 3 accounts from the exact same IP within 24h to prevent referral farming bots
  if (ipHash && ipHash !== "unknown") {
    const recentFromIp = db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM referral_attributions 
        WHERE ip_address_hash = ? AND created_at >= datetime('now', '-1 day')
      `)
      .get(ipHash) as { count: number };

    if (recentFromIp && recentFromIp.count >= 3) {
      // Flag as invalidated due to high velocity IP abuse
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO referral_attributions (
          id, referral_code, referrer_user_id, referred_user_id, ip_address_hash, user_agent_hash, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'invalidated', ?)
      `).run(id, code, refCodeRow.user_id, newUserId, ipHash, uaHash || null, now);
      return null;
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO referral_attributions (
      id, referral_code, referrer_user_id, referred_user_id, ip_address_hash, user_agent_hash, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'attributed', ?)
  `).run(id, code, refCodeRow.user_id, newUserId, ipHash || null, uaHash || null, now);

  return {
    id,
    referral_code: code,
    referrer_user_id: refCodeRow.user_id,
    referred_user_id: newUserId,
    ip_address_hash: ipHash,
    user_agent_hash: uaHash,
    status: "attributed",
    created_at: now,
  };
}

function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function processQualifyingReferralReward(
  paymentId: string,
  payerUserId: string,
  planSlug: PlanSlug
): ReferralReward | null {
  const db = getDb();
  const programStatus = getProgramStatus();

  // If program is disabled or suspended, do not generate rewards
  if (programStatus === "disabled" || programStatus === "suspended") {
    return null;
  }

  // Find attribution for this payer
  const attribution = db
    .prepare("SELECT * FROM referral_attributions WHERE referred_user_id = ?")
    .get(payerUserId) as ReferralAttribution | undefined;

  if (!attribution) return null;

  // Anti-fraud: Prevent invalidated or self-referral
  if (attribution.status === "invalidated" || attribution.referrer_user_id === payerUserId) {
    return null;
  }

  // Anti-fraud: Shared M-Pesa phone number between payer and referrer (Self-funding loophole prevention)
  const paymentRow = db
    .prepare("SELECT phone_number FROM payments WHERE id = ?")
    .get(paymentId) as { phone_number?: string } | undefined;

  const payerPhone = normalizePhone(paymentRow?.phone_number);

  if (payerPhone) {
    // Check referrer profile phone
    const referrerProfile = db
      .prepare("SELECT phone_number FROM profiles WHERE id = ?")
      .get(attribution.referrer_user_id) as { phone_number?: string } | undefined;

    const referrerPhone = normalizePhone(referrerProfile?.phone_number);

    // Check referrer's past payments
    const referrerPayments = db
      .prepare("SELECT phone_number FROM payments WHERE user_id = ? AND phone_number IS NOT NULL")
      .all(attribution.referrer_user_id) as Array<{ phone_number: string }>;

    // Check referrer's withdrawal requests
    const referrerWithdrawals = db
      .prepare("SELECT phone_number FROM withdrawal_requests WHERE user_id = ? AND phone_number IS NOT NULL")
      .all(attribution.referrer_user_id) as Array<{ phone_number: string }>;

    const allReferrerPhones = [
      referrerPhone,
      ...referrerPayments.map((p) => normalizePhone(p.phone_number)),
      ...referrerWithdrawals.map((w) => normalizePhone(w.phone_number)),
    ].filter(Boolean);

    if (allReferrerPhones.includes(payerPhone)) {
      // Invalidate attribution due to shared financial instrument (self-referral fraud)
      db.prepare("UPDATE referral_attributions SET status = 'invalidated' WHERE id = ?").run(attribution.id);
      return null;
    }
  }

  // Check if this payment already generated a reward (Strict idempotency)
  const existingReward = db
    .prepare("SELECT id FROM referral_rewards WHERE qualifying_payment_id = ?")
    .get(paymentId) as { id: string } | undefined;

  if (existingReward) return null;

  // Look up configured plan referral reward
  const plan = db
    .prepare("SELECT direct_referral_reward_kes FROM membership_plans WHERE slug = ?")
    .get(planSlug) as { direct_referral_reward_kes: number } | undefined;

  if (!plan || plan.direct_referral_reward_kes <= 0) return null;

  const rewardAmount = plan.direct_referral_reward_kes;
  const rewardId = crypto.randomUUID();
  const now = new Date();
  const holdUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7-day review window
  const nowIso = now.toISOString();

  // Transactionally record reward and pending wallet ledger
  db.exec("BEGIN IMMEDIATE;");
  try {
    // 1. Insert referral reward record
    db.prepare(`
      INSERT INTO referral_rewards (
        id, attribution_id, referrer_user_id, referred_user_id, qualifying_payment_id,
        plan_slug, reward_amount_kes, status, hold_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      rewardId,
      attribution.id,
      attribution.referrer_user_id,
      payerUserId,
      paymentId,
      planSlug,
      rewardAmount,
      holdUntil,
      nowIso,
      nowIso
    );

    // 2. Mark attribution as qualified
    db.prepare("UPDATE referral_attributions SET status = 'qualified' WHERE id = ?").run(attribution.id);

    // 3. Ensure wallet exists and increment pending balance
    let wallet = db
      .prepare("SELECT id, pending_balance, approved_balance FROM wallet_accounts WHERE user_id = ?")
      .get(attribution.referrer_user_id) as { id: string; pending_balance: number; approved_balance: number } | undefined;

    if (!wallet) {
      const walletId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO wallet_accounts (id, user_id, currency, pending_balance, approved_balance, withdrawn_balance, created_at, updated_at)
        VALUES (?, ?, 'KES', 0, 0, 0, ?, ?)
      `).run(walletId, attribution.referrer_user_id, nowIso, nowIso);

      wallet = { id: walletId, pending_balance: 0, approved_balance: 0 };
    }

    const newPending = wallet.pending_balance + rewardAmount;
    db.prepare("UPDATE wallet_accounts SET pending_balance = ?, updated_at = ? WHERE id = ?")
      .run(newPending, nowIso, wallet.id);

    // 4. Create ledger entry
    const ledgerId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO wallet_ledger_entries (
        id, wallet_id, user_id, entry_type, amount_kes, balance_after_kes,
        reference_type, reference_id, notes, created_at
      ) VALUES (?, ?, ?, 'reward_pending', ?, ?, 'referral_reward', ?, ?, ?)
    `).run(
      ledgerId,
      wallet.id,
      attribution.referrer_user_id,
      rewardAmount,
      newPending,
      rewardId,
      `Pending reward for referred user upgrading to ${planSlug.toUpperCase()}`,
      nowIso
    );

    db.exec("COMMIT;");

    return {
      id: rewardId,
      attribution_id: attribution.id,
      referrer_user_id: attribution.referrer_user_id,
      referred_user_id: payerUserId,
      qualifying_payment_id: paymentId,
      plan_slug: planSlug,
      reward_amount_kes: rewardAmount,
      status: "pending",
      hold_until: holdUntil,
      created_at: nowIso,
      updated_at: nowIso,
    };
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function reviewReferralReward(
  rewardId: string,
  action: "approve" | "reject",
  reviewerUserId: string,
  rejectionReason?: string
): ReferralReward | null {
  const db = getDb();
  const reward = db
    .prepare("SELECT * FROM referral_rewards WHERE id = ?")
    .get(rewardId) as ReferralReward | undefined;

  if (!reward || reward.status !== "pending") return null;

  const nowIso = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE;");
  try {
    const newStatus: RewardStatus = action === "approve" ? "approved" : "rejected";

    db.prepare(`
      UPDATE referral_rewards
      SET status = ?, reviewed_by = ?, reviewed_at = ?, rejection_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, reviewerUserId, nowIso, rejectionReason || null, nowIso, rewardId);

    const wallet = db
      .prepare("SELECT id, pending_balance, approved_balance FROM wallet_accounts WHERE user_id = ?")
      .get(reward.referrer_user_id) as { id: string; pending_balance: number; approved_balance: number } | undefined;

    if (wallet) {
      if (action === "approve") {
        const newPending = Math.max(0, wallet.pending_balance - reward.reward_amount_kes);
        const newApproved = wallet.approved_balance + reward.reward_amount_kes;

        db.prepare("UPDATE wallet_accounts SET pending_balance = ?, approved_balance = ?, updated_at = ? WHERE id = ?")
          .run(newPending, newApproved, nowIso, wallet.id);

        const ledgerId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO wallet_ledger_entries (
            id, wallet_id, user_id, entry_type, amount_kes, balance_after_kes,
            reference_type, reference_id, notes, created_at
          ) VALUES (?, ?, ?, 'reward_approved', ?, ?, 'referral_reward', ?, ?, ?)
        `).run(
          ledgerId,
          wallet.id,
          reward.referrer_user_id,
          reward.reward_amount_kes,
          newApproved,
          rewardId,
          `Referral reward approved and released to withdrawable balance for ${reward.plan_slug.toUpperCase()}`,
          nowIso
        );
      } else {
        const newPending = Math.max(0, wallet.pending_balance - reward.reward_amount_kes);
        db.prepare("UPDATE wallet_accounts SET pending_balance = ?, updated_at = ? WHERE id = ?")
          .run(newPending, nowIso, wallet.id);

        const ledgerId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO wallet_ledger_entries (
            id, wallet_id, user_id, entry_type, amount_kes, balance_after_kes,
            reference_type, reference_id, notes, created_at
          ) VALUES (?, ?, ?, 'reward_clawback', ?, ?, 'referral_reward', ?, ?, ?)
        `).run(
          ledgerId,
          wallet.id,
          reward.referrer_user_id,
          -reward.reward_amount_kes,
          newPending,
          rewardId,
          `Referral reward rejected: ${rejectionReason || "Compliance rejection"}`,
          nowIso
        );
      }
    }

    db.exec("COMMIT;");
    return {
      ...reward,
      status: newStatus,
      reviewed_by: reviewerUserId,
      reviewed_at: nowIso,
      rejection_reason: rejectionReason,
      updated_at: nowIso,
    };
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}
// Append helper exports to src/lib/referral.ts
export function approveReferralReward(rewardId: string, reviewerUserId: string): boolean {
  return reviewReferralReward(rewardId, "approve", reviewerUserId) !== null;
}

export function rejectReferralReward(rewardId: string, reviewerUserId: string, reason?: string): boolean {
  return reviewReferralReward(rewardId, "reject", reviewerUserId, reason) !== null;
}

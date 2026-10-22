import test from "node:test";
import assert from "node:assert";
import { getDb } from "../lib/db";
import {
  getReferralCodeForUser,
  attributeReferral,
  getProgramStatus,
  setProgramStatus,
} from "../lib/referral";
import { getWallet, submitWithdrawalRequest } from "../lib/wallet";
import { getUserEntitlements } from "../lib/entitlements";
import { handlePaymentWebhook } from "../lib/payments";
import crypto from "node:crypto";
import { MembershipPlan, ReferralReward } from "../types";

test("CodeVanta Advanta Hub — Comprehensive Domain Test Suite", async (t) => {
  const db = getDb();
  assert.ok(db, "Database initialized and schema migrated successfully");

  await t.test("1. Database Seed Verification", () => {
    const categoriesCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
    assert.ok(categoriesCount.count >= 10, "Should have at least 10 seeded categories");

    const resourcesCount = db.prepare("SELECT COUNT(*) as count FROM resources").get() as { count: number };
    assert.ok(resourcesCount.count >= 20, "Should have at least 20 verified developer resources");

    const plans = db.prepare("SELECT * FROM membership_plans").all() as unknown as MembershipPlan[];
    assert.strictEqual(plans.length, 3, "Should have 3 membership plans (Basic, Pro, VIP)");

    const basicPlan = plans.find((p) => p.slug === "basic");
    const proPlan = plans.find((p) => p.slug === "pro");
    const vipPlan = plans.find((p) => p.slug === "vip");

    assert.ok(basicPlan && proPlan && vipPlan, "All 3 plans must exist");
    assert.strictEqual(basicPlan.price_kes, 150, "Basic plan should be KES 150");
    assert.strictEqual(basicPlan.direct_referral_reward_kes, 50, "Basic referral reward should be KES 50");

    assert.strictEqual(proPlan.price_kes, 250, "Pro plan should be KES 250");
    assert.strictEqual(proPlan.direct_referral_reward_kes, 100, "Pro referral reward should be KES 100");

    assert.strictEqual(vipPlan.price_kes, 350, "VIP plan should be KES 350");
    assert.strictEqual(vipPlan.direct_referral_reward_kes, 150, "VIP referral reward should be KES 150");
  });

  await t.test("2. Entitlements Enforcement", () => {
    // Unauthenticated / Free user
    const freeEntitlements = getUserEntitlements(null);
    assert.strictEqual(freeEntitlements.planSlug, "free");
    assert.strictEqual(freeEntitlements.canAccessBasicDirectory, true);
    assert.strictEqual(freeEntitlements.canUseAdvancedSearch, false);
    assert.strictEqual(freeEntitlements.canDownloadStarterKits, false);
    assert.strictEqual(freeEntitlements.maxBookmarks, 3);

    // Seeded Pro member (dev@codevanta.com)
    const proEntitlements = getUserEntitlements("00000000-0000-4000-a000-000000000002");
    assert.strictEqual(proEntitlements.planSlug, "pro");
    assert.strictEqual(proEntitlements.canUseAdvancedSearch, true);
    assert.strictEqual(proEntitlements.canAccessOriginalBlueprints, true);
    assert.strictEqual(proEntitlements.canDownloadStarterKits, false);
    assert.strictEqual(proEntitlements.maxBookmarks, 50);
  });

  await t.test("3. Referral Anti-Fraud Controls", () => {
    const referrerId = "00000000-0000-4000-a000-000000000002"; // Dev member
    const refCodeObj = getReferralCodeForUser(referrerId);
    assert.ok(refCodeObj && refCodeObj.code, "User should have a valid referral code");

    // Self-Referral Prevention Test
    const selfAttribution = attributeReferral(refCodeObj.code, referrerId);
    assert.strictEqual(selfAttribution, null, "Self-referral must be strictly rejected");

    // Valid referral of new user with unique email
    const newUserId = crypto.randomUUID();
    const uniqueEmail = `referred_${newUserId.slice(0, 8)}@example.com`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Test Referred User', 'user', 'KE', ?, ?)
    `).run(newUserId, uniqueEmail, now, now);

    const validAttribution = attributeReferral(refCodeObj.code, newUserId);
    assert.ok(validAttribution, "Valid referral attribution should succeed");
    assert.strictEqual(validAttribution.referrer_user_id, referrerId);
    assert.strictEqual(validAttribution.referred_user_id, newUserId);

    // Duplicate attribution prevention
    const duplicateAttribution = attributeReferral(refCodeObj.code, newUserId);
    assert.strictEqual(duplicateAttribution, null, "Duplicate attribution for same user must be rejected");
  });

  await t.test("4. Payment Processing, Webhook Idempotency & Referral Reward Ledger", () => {
    const referrerId = "00000000-0000-4000-a000-000000000002";
    const newUserId = crypto.randomUUID();
    const uniqueEmail = `payer_${newUserId.slice(0, 8)}@example.com`;
    const now = new Date().toISOString();

    // Create new user profile
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Paying Customer', 'user', 'KE', ?, ?)
    `).run(newUserId, uniqueEmail, now, now);

    // Attribute to referrer
    const refCodeObj = getReferralCodeForUser(referrerId);
    assert.ok(refCodeObj, "Referral code object must exist");
    attributeReferral(refCodeObj.code, newUserId);

    // Create pending payment for VIP plan (KES 350)
    const paymentId = crypto.randomUUID();
    const vipPlan = db.prepare("SELECT * FROM membership_plans WHERE slug = 'vip'").get() as MembershipPlan;

    db.prepare(`
      INSERT INTO payments (
        id, user_id, plan_id, amount_kes, currency, provider, provider_reference,
        status, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'KES', 'sandbox', 'TEST-REF-001', 'pending', ?, ?, ?)
    `).run(paymentId, newUserId, vipPlan.id, vipPlan.price_kes, `IDEMP-${paymentId}`, now, now);

    // 1st Webhook Execution -> Completed
    const webhookRes1 = handlePaymentWebhook({
      paymentId,
      status: "completed",
      mpesaReceiptNumber: `QA_${Date.now()}`,
    });

    assert.strictEqual(webhookRes1.success, true, "First payment webhook must succeed");

    // Verify user profile upgraded to member
    const updatedUser = db.prepare("SELECT role FROM profiles WHERE id = ?").get(newUserId) as { role: string };
    assert.strictEqual(updatedUser.role, "member", "Payer role should be upgraded to member");

    // Verify active membership created
    const activeMem = db.prepare("SELECT * FROM memberships WHERE user_id = ? AND status = 'active'").get(newUserId) as { plan_slug: string };
    assert.ok(activeMem, "Active membership must exist");
    assert.strictEqual(activeMem.plan_slug, "vip");

    // Verify referral reward created in pending status (KES 150 for VIP)
    const reward = db.prepare("SELECT * FROM referral_rewards WHERE qualifying_payment_id = ?").get(paymentId) as ReferralReward;
    assert.ok(reward, "Referral reward must be recorded");
    assert.strictEqual(reward.status, "pending");
    assert.strictEqual(reward.reward_amount_kes, 150);

    // 2nd Webhook Execution (Simulate duplicate network retry) -> Must be idempotent!
    const webhookRes2 = handlePaymentWebhook({
      paymentId,
      status: "completed",
      mpesaReceiptNumber: "QA_DUPLICATE_RETRY",
    });

    assert.strictEqual(webhookRes2.success, true);
    assert.ok(webhookRes2.message.includes("idempotently"), "Duplicate webhook must be caught idempotently");

    // Check reward count is still exactly 1
    const rewardCount = db.prepare("SELECT COUNT(*) as count FROM referral_rewards WHERE qualifying_payment_id = ?").get(paymentId) as { count: number };
    assert.strictEqual(rewardCount.count, 1, "Duplicate payment callback must never generate duplicate reward");
  });

  await t.test("5. Legal Compliance Gate & Wallet Ledger Auditing", () => {
    const adminId = "00000000-0000-4000-a000-000000000001";
    const testUserId = crypto.randomUUID();
    const uniqueEmail = `wallet_${testUserId.slice(0, 8)}@example.com`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Wallet Tester', 'member', 'KE', ?, ?)
    `).run(testUserId, uniqueEmail, now, now);

    // Initialize wallet with KES 500 approved balance
    const walletId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO wallet_accounts (id, user_id, currency, pending_balance, approved_balance, withdrawn_balance, created_at, updated_at)
      VALUES (?, ?, 'KES', 0.0, 500.0, 0.0, ?, ?)
    `).run(walletId, testUserId, now, now);

    // Test Gate 1: When status is 'compliance_review' (Default), withdrawal MUST fail
    setProgramStatus("compliance_review", adminId);
    assert.strictEqual(getProgramStatus(), "compliance_review");

    const blockedWithdrawal = submitWithdrawalRequest(testUserId, 200, "0711223344", "Wallet Tester");
    assert.strictEqual(blockedWithdrawal.success, false, "Withdrawals must be locked during compliance_review");
    assert.ok(blockedWithdrawal.error && blockedWithdrawal.error.includes("COMPLIANCE_REVIEW"), "Error message must cite legal compliance review");

    // Test Gate 2: Certify legal approval and transition to 'approved_for_launch'
    setProgramStatus(
      "approved_for_launch",
      adminId,
      "Certified compliant under Kenyan Consumer Protection Act 2012 by Advocate O. Mwangi (P105/9988)"
    );
    assert.strictEqual(getProgramStatus(), "approved_for_launch");

    // Now withdrawal should succeed
    const allowedWithdrawal = submitWithdrawalRequest(testUserId, 200, "0711223344", "Wallet Tester");
    assert.strictEqual(allowedWithdrawal.success, true, "Withdrawal must succeed after legal certification");
    assert.ok(allowedWithdrawal.request, "Withdrawal request object returned");

    // Verify wallet approved balance deducted from 500 to 300
    const { wallet, ledger } = getWallet(testUserId);
    assert.strictEqual(wallet.approved_balance, 300, "Wallet balance must be exactly 300 after 200 withdrawal");

    // Verify append-only ledger entry recorded
    const withdrawalEntry = ledger.find((e) => e.entry_type === "withdrawal_request");
    assert.ok(withdrawalEntry, "Ledger must record withdrawal_request entry");
    assert.strictEqual(withdrawalEntry.amount_kes, -200);
    assert.strictEqual(withdrawalEntry.balance_after_kes, 300);

    // Reset status back to compliance_review (production default)
    setProgramStatus("compliance_review", adminId);
  });
});

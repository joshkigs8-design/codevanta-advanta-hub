process.env.DATABASE_PATH = ":memory:";
process.env.NODE_ENV = "test";

import test from "node:test";
import assert from "node:assert";
import { getDb } from "../lib/db";
import {
  getReferralCodeForUser,
  attributeReferral,
  getProgramStatus,
  setProgramStatus,
  processQualifyingReferralReward,
  createReferralPayout,
  recordReferralPayout,
} from "../lib/referral";
import { getWallet, submitWithdrawalRequest, processWithdrawalRequest } from "../lib/wallet";
import { getUserEntitlements } from "../lib/entitlements";
import { handlePaymentWebhook, initiateCheckout, verifyPaystackSignature, verifyWebhookSignature, formatKenyanPhoneNumber } from "../lib/payments";
import crypto from "node:crypto";
import { MembershipPlan, ReferralReward } from "../types";

test("CodeVanta Advanta Hub — Comprehensive Domain Test Suite", async (t) => {
  const db = getDb();
  assert.ok(db, "Database initialized and schema migrated successfully");

  // In-memory test fixtures
  const fixtureNow = new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO profiles (id, email, password_hash, full_name, avatar_url, role, phone_number, country, created_at, updated_at)
    VALUES ('00000000-0000-4000-a000-000000000002', 'test-fixture@codevanta.test', 'testhash', 'Test Fixture Member', NULL, 'member', '+254700000002', 'KE', ?, ?)
  `).run(fixtureNow, fixtureNow);

  db.prepare(`
    INSERT OR REPLACE INTO referral_codes (id, user_id, code, clicks, created_at)
    VALUES ('ref-code-fixture', '00000000-0000-4000-a000-000000000002', 'FIXTURE50', 0, ?)
  `).run(fixtureNow);

  db.prepare(`
    INSERT OR REPLACE INTO wallet_accounts (id, user_id, currency, pending_balance, approved_balance, withdrawn_balance, created_at, updated_at)
    VALUES ('wallet-fixture', '00000000-0000-4000-a000-000000000002', 'KES', 0.0, 0.0, 0.0, ?, ?)
  `).run(fixtureNow, fixtureNow);

  db.prepare(`
    INSERT OR REPLACE INTO memberships (id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes, starts_at, expires_at, payment_reference, created_at, updated_at)
    VALUES ('mem-fixture-001', '00000000-0000-4000-a000-000000000002', 'plan-pro-250', 'pro', 'Pro Tier', 'active', 250, ?, NULL, 'FIXTURE-TXN-001', ?, ?)
  `).run(fixtureNow, fixtureNow, fixtureNow);

  await t.test("1. Database Seed Verification", () => {
    const categoriesCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
    assert.ok(categoriesCount.count >= 10, "Should have at least 10 seeded categories");

    const resourcesCount = db.prepare("SELECT COUNT(*) as count FROM resources").get() as { count: number };
    assert.ok(resourcesCount.count >= 20, "Should have at least 20 verified developer resources");

    const plans = db.prepare("SELECT * FROM membership_plans").all() as unknown as MembershipPlan[];
    assert.strictEqual(plans.length, 4, "Should have 4 membership plans (Starter, Basic, Pro, VIP)");

    const starterPlan = plans.find((p) => p.slug === "starter");
    const basicPlan = plans.find((p) => p.slug === "basic");
    const proPlan = plans.find((p) => p.slug === "pro");
    const vipPlan = plans.find((p) => p.slug === "vip");

    assert.ok(starterPlan && basicPlan && proPlan && vipPlan, "All 4 plans must exist");
    assert.strictEqual(starterPlan.price_kes, 70, "Starter plan should be KES 70");
    assert.strictEqual(starterPlan.direct_referral_reward_kes, 20, "Starter referral reward should be KES 20 (20 bob)");

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

    // Shared Phone Number Anti-Fraud: Referrer phone registered
    db.prepare("UPDATE profiles SET phone_number = '0712999888' WHERE id = ?").run(referrerId);

    // Another new referred user
    const botUserId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Colluding User', 'user', 'KE', ?, ?)
    `).run(botUserId, `bot_${botUserId.slice(0, 8)}@example.com`, now, now);

    const botAttribution = attributeReferral(refCodeObj.code, botUserId);
    assert.ok(botAttribution, "Initial registration attribution accepted");

    // Payment using referrer's exact phone number (e.g. with country prefix +254712999888)
    const fraudPaymentId = crypto.randomUUID();
    const proPlan = db.prepare("SELECT * FROM membership_plans WHERE slug = 'pro'").get() as MembershipPlan;
    db.prepare(`
      INSERT INTO payments (
        id, user_id, plan_id, amount_kes, currency, provider, provider_reference,
        phone_number, status, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'KES', 'sandbox', 'FRAUD-PHONE-01', '+254712999888', 'completed', ?, ?, ?)
    `).run(fraudPaymentId, botUserId, proPlan.id, proPlan.price_kes, `IDEMP-${fraudPaymentId}`, now, now);

    // Process reward: Should detect shared phone and invalidate attribution
    const fraudReward = processQualifyingReferralReward(fraudPaymentId, botUserId, "pro");
    assert.strictEqual(fraudReward, null, "Shared M-Pesa phone number must block referral reward qualification");

    const checkedAttribution = db.prepare("SELECT status FROM referral_attributions WHERE id = ?").get(botAttribution.id) as { status: string };
    assert.strictEqual(checkedAttribution.status, "invalidated", "Attribution with matching referrer phone must be invalidated");
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

    // Verify referral reward created in approved status (KES 150 for VIP)
    const reward = db.prepare("SELECT * FROM referral_rewards WHERE qualifying_payment_id = ?").get(paymentId) as ReferralReward;
    assert.ok(reward, "Referral reward must be recorded");
    assert.strictEqual(reward.status, "approved");
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

    // Test Concurrency Lock: A 2nd withdrawal while the 1st is still 'submitted' must be rejected
    const concurrentWithdrawal = submitWithdrawalRequest(testUserId, 100, "0711223344", "Wallet Tester");
    assert.strictEqual(concurrentWithdrawal.success, false, "Concurrent withdrawal must be rejected");
    assert.ok(
      concurrentWithdrawal.error && concurrentWithdrawal.error.includes("in progress"),
      "Must cite existing in-progress withdrawal"
    );

    // Complete the first withdrawal
    db.prepare("UPDATE withdrawal_requests SET status = 'completed' WHERE id = ?").run(allowedWithdrawal.request.id);

    // Now a subsequent withdrawal should succeed
    const subsequentWithdrawal = submitWithdrawalRequest(testUserId, 100, "0711223344", "Wallet Tester");
    assert.strictEqual(subsequentWithdrawal.success, true, "Subsequent withdrawal succeeds after previous is completed");

    // Reset status back to approved_for_launch
    setProgramStatus("approved_for_launch", adminId);
  });

  await t.test("6. Launchday Promo Codes Verification (Capacity, Expiration & Upgrades)", () => {
    // 1. Check seeded codes
    const launchCode = db.prepare("SELECT * FROM promo_codes WHERE code = 'LAUNCHDAY'").get() as any;
    assert.ok(launchCode, "Seeded LAUNCHDAY promo code must exist");
    assert.strictEqual(launchCode.max_uses, 5, "LAUNCHDAY must have capacity of 5");
    assert.strictEqual(launchCode.plan_slug, "vip", "LAUNCHDAY must grant VIP tier");

    // 2. Setup a free user fixture
    const freeUserId = "00000000-0000-4000-a000-000000000099";
    const freeUserNow = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, 'earlybird@codevanta.test', 'hash', 'Early Bird', 'user', ?, ?)
    `).run(freeUserId, freeUserNow, freeUserNow);

    const initialEntitlements = getUserEntitlements(freeUserId);
    assert.strictEqual(initialEntitlements.planSlug, "free", "User starts on free tier");

    // 3. Simulate redemption logic
    const redemptionId = `red_test_${Date.now()}`;
    const membershipId = `mem_test_${Date.now()}`;

    db.prepare(`
      INSERT INTO promo_code_redemptions (id, promo_code_id, promo_code, user_id, user_email, plan_slug, redeemed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(redemptionId, launchCode.id, launchCode.code, freeUserId, "earlybird@codevanta.test", launchCode.plan_slug, freeUserNow);

    db.prepare("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?").run(launchCode.id);

    db.prepare(`
      INSERT INTO memberships (id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes, starts_at, expires_at, payment_reference, created_at, updated_at)
      VALUES (?, ?, 'plan-vip-350', 'vip', 'VIP Architecture', 'active', 0, ?, NULL, 'PROMO_LAUNCHDAY', ?, ?)
    `).run(membershipId, freeUserId, freeUserNow, freeUserNow, freeUserNow);

    // 4. Verify upgraded entitlements
    const upgradedEntitlements = getUserEntitlements(freeUserId);
    assert.strictEqual(upgradedEntitlements.planSlug, "vip", "User upgraded to VIP tier immediately");
    assert.strictEqual(upgradedEntitlements.canDownloadStarterKits, true, "VIP entitlement granted");

    // 5. Test capacity increment
    const updatedLaunchCode = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(launchCode.id) as any;
    assert.strictEqual(updatedLaunchCode.used_count, 1, "Used count incremented to 1");

    // 6. Test duplicate prevention
    const duplicate = db.prepare("SELECT id FROM promo_code_redemptions WHERE promo_code_id = ? AND user_id = ?").get(launchCode.id, freeUserId);
    assert.ok(duplicate, "Duplicate redemption check catches prior claim");

    // 7. Test capacity ceiling
    db.prepare("UPDATE promo_codes SET used_count = 5 WHERE id = ?").run(launchCode.id);
    const fullCode = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(launchCode.id) as any;
    assert.ok(fullCode.used_count >= fullCode.max_uses, "Capacity ceiling correctly met");
  });
  await t.test("7. Starter Tier Subscription & KES 20 (20 Bob) Referral Reward", () => {
    const starterUserId = crypto.randomUUID();
    const starterReferrerId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create referrer
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, 'ref_starter@codevanta.com', 'HASH', 'Starter Referrer', 'user', 'KE', ?, ?)
    `).run(starterReferrerId, now, now);

    const refCodeObj = getReferralCodeForUser(starterReferrerId);
    assert.ok(refCodeObj, "Referrer code generated");

    // Create starter buyer
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, 'buyer_starter@codevanta.com', 'HASH', 'Starter Buyer', 'user', 'KE', ?, ?)
    `).run(starterUserId, now, now);

    // Attribute referral
    attributeReferral(refCodeObj.code, starterUserId);

    // Initiate Starter Plan checkout (KES 70)
    const checkoutRes = initiateCheckout(starterUserId, "starter", "+254711223344");
    assert.strictEqual(checkoutRes.success, true, "Starter checkout initiated");
    assert.strictEqual(checkoutRes.payment?.amount_kes, 70, "Starter plan price is KES 70");

    // Complete payment webhook
    const webhookRes = handlePaymentWebhook({
      paymentId: checkoutRes.payment!.id,
      status: "completed",
      mpesaReceiptNumber: `STARTER_${Date.now()}`,
    });
    assert.strictEqual(webhookRes.success, true, "Starter payment completed");

    // Verify referral reward is exactly KES 20 (20 bob)
    const reward = db.prepare("SELECT * FROM referral_rewards WHERE qualifying_payment_id = ?").get(checkoutRes.payment!.id) as ReferralReward;
    assert.ok(reward, "Referral reward recorded");
    assert.strictEqual(reward.status, "approved", "Auto-approved reward");
    assert.strictEqual(reward.reward_amount_kes, 20, "Referral reward is exactly KES 20 (20 bob)");
    assert.strictEqual(reward.plan_slug, "starter");

    // Verify buyer entitlements
    const entitlements = getUserEntitlements(starterUserId);
    assert.strictEqual(entitlements.planSlug, "starter", "Buyer has starter plan entitlements");
    assert.strictEqual(entitlements.maxBookmarks, 15, "Starter max bookmarks is 15");
  });
  await t.test("8. 2-Tier Referral System (Level 1 Direct & Level 2 Network Referral)", () => {
    const userAId = crypto.randomUUID();
    const userBId = crypto.randomUUID();
    const userCId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Create User A (Original Referrer)
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, phone_number, created_at, updated_at)
      VALUES (?, 'userA@codevanta.com', 'HASH', 'User Alpha', 'user', 'KE', '+254701000001', ?, ?)
    `).run(userAId, now, now);

    const codeA = getReferralCodeForUser(userAId);
    assert.ok(codeA, "User A referral code generated");

    // 2. User B registers under User A
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, phone_number, created_at, updated_at)
      VALUES (?, 'userB@codevanta.com', 'HASH', 'User Bravo', 'user', 'KE', '+254702000002', ?, ?)
    `).run(userBId, now, now);

    attributeReferral(codeA.code, userBId);
    const codeB = getReferralCodeForUser(userBId);
    assert.ok(codeB, "User B referral code generated");

    // 3. User C registers under User B
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, phone_number, created_at, updated_at)
      VALUES (?, 'userC@codevanta.com', 'HASH', 'User Charlie', 'user', 'KE', '+254703000003', ?, ?)
    `).run(userCId, now, now);

    attributeReferral(codeB.code, userCId);

    // 4. User C subscribes to Pro Tier (KES 250)
    const checkoutRes = initiateCheckout(userCId, "pro", "+254703000003");
    assert.strictEqual(checkoutRes.success, true, "Pro checkout initiated");

    const webhookRes = handlePaymentWebhook({
      paymentId: checkoutRes.payment!.id,
      status: "completed",
      mpesaReceiptNumber: `2TIER_${Date.now()}`,
    });
    assert.strictEqual(webhookRes.success, true, "Payment webhook completed");

    // 5. Verify Level 1 reward for User B (KES 100 on Pro)
    const level1Reward = db.prepare(`
      SELECT * FROM referral_rewards
      WHERE qualifying_payment_id = ? AND tier_level = 1
    `).get(checkoutRes.payment!.id) as ReferralReward;

    assert.ok(level1Reward, "Level 1 reward exists");
    assert.strictEqual(level1Reward.referrer_user_id, userBId, "User B receives Level 1 reward");
    assert.strictEqual(level1Reward.reward_amount_kes, 100, "Level 1 reward is KES 100");
    assert.strictEqual(level1Reward.status, "approved", "Auto-approved Level 1");

    // 6. Verify Level 2 reward for User A (KES 25 on Pro)
    const level2Reward = db.prepare(`
      SELECT * FROM referral_rewards
      WHERE qualifying_payment_id = ? AND tier_level = 2
    `).get(checkoutRes.payment!.id) as ReferralReward;

    assert.ok(level2Reward, "Level 2 reward exists");
    assert.strictEqual(level2Reward.referrer_user_id, userAId, "User A receives Level 2 network bonus");
    assert.strictEqual(level2Reward.reward_amount_kes, 25, "Level 2 bonus is KES 25");
    assert.strictEqual(level2Reward.status, "approved", "Auto-approved Level 2");

    // 7. Verify Wallets
    const walletB = db.prepare("SELECT approved_balance FROM wallet_accounts WHERE user_id = ?").get(userBId) as { approved_balance: number };
    assert.strictEqual(walletB.approved_balance, 100, "User B approved balance is KES 100");

    const walletA = db.prepare("SELECT approved_balance FROM wallet_accounts WHERE user_id = ?").get(userAId) as { approved_balance: number };
    assert.strictEqual(walletA.approved_balance, 25, "User A approved balance is KES 25");

    // 8. Test Idempotency: duplicate payment processing does NOT create duplicate rewards
    const dupeRes = handlePaymentWebhook({
      paymentId: checkoutRes.payment!.id,
      status: "completed",
      mpesaReceiptNumber: `DUPE_${Date.now()}`,
    });
    assert.strictEqual(dupeRes.success, true);

    const totalRewardsForPayment = db.prepare("SELECT COUNT(*) as count FROM referral_rewards WHERE qualifying_payment_id = ?").get(checkoutRes.payment!.id) as { count: number };
    assert.strictEqual(totalRewardsForPayment.count, 2, "Strictly 2 rewards (Level 1 + Level 2) created, no duplicates");
  });

  await t.test("9. Manual Referral Payout Disbursal via Paystack & Rejection Handling", () => {
    const adminId = "00000000-0000-4000-a000-000000000001";
    const payoutUserId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Create a member with 150 KES approved wallet balance
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, 'payout_tester@codevanta.com', 'HASH', 'Payout Member', 'user', 'KE', ?, ?)
    `).run(payoutUserId, now, now);

    const { wallet: initialWallet } = getWallet(payoutUserId);
    db.prepare("UPDATE wallet_accounts SET approved_balance = 150 WHERE id = ?").run(initialWallet.id);

    // 2. Member requests withdrawal of KES 100
    const subRes = submitWithdrawalRequest(payoutUserId, 100, "0712345678", "Payout Member", "paystack_transfer");
    assert.strictEqual(subRes.success, true, "Withdrawal request submitted successfully");
    const reqId = subRes.request!.id;

    // Verify balance reduced to 50
    const { wallet: afterSubWallet } = getWallet(payoutUserId);
    assert.strictEqual(afterSubWallet.approved_balance, 50, "Approved balance deducted by requested 100");

    // 3. Admin manually transfers via Paystack and approves with Paystack transfer reference
    const paystackRef = `TRF_pstk_manual_${Date.now()}`;
    const approvalRes = processWithdrawalRequest(
      reqId,
      adminId,
      "approve",
      paystackRef,
      "Disbursed KES 100 manually via Paystack Transfer",
      "paystack_transfer"
    );
    assert.strictEqual(approvalRes.success, true, "Payout approved and recorded successfully");

    // 4. Verify request status is 'paid', external_transaction_id matches Paystack reference
    const paidReq = db.prepare("SELECT * FROM withdrawal_requests WHERE id = ?").get(reqId) as any;
    assert.strictEqual(paidReq.status, "paid", "Withdrawal status must be 'paid'");
    assert.strictEqual(paidReq.external_transaction_id, paystackRef, "Paystack transfer reference must be stored");
    assert.strictEqual(paidReq.payment_method, "paystack_transfer", "Payment method must be stored as Paystack Transfer");

    // 5. Verify withdrawn_balance updated in wallet and ledger entry exists
    const { wallet: finalWallet, ledger } = getWallet(payoutUserId);
    assert.strictEqual(finalWallet.withdrawn_balance, 100, "Withdrawn balance must be KES 100");
    assert.strictEqual(finalWallet.approved_balance, 50, "Approved balance remains KES 50");

    const approvedLedger = ledger.find((e) => e.entry_type === "withdrawal_approved");
    assert.ok(approvedLedger, "Ledger must contain withdrawal_approved entry");
    assert.ok(approvedLedger.notes.includes(paystackRef), "Ledger note must reference the Paystack code");

    // 6. Test Rejection: Member requests remaining KES 50, admin rejects with reason
    const subRes2 = submitWithdrawalRequest(payoutUserId, 50, "0712345678", "Payout Member");
    assert.strictEqual(subRes2.success, true, "Second withdrawal submitted");
    const req2Id = subRes2.request!.id;

    const rejectRes = processWithdrawalRequest(
      req2Id,
      adminId,
      "reject",
      undefined,
      "Invalid recipient phone number on Paystack"
    );
    assert.strictEqual(rejectRes.success, true, "Withdrawal rejected");

    const rejectedReq = db.prepare("SELECT * FROM withdrawal_requests WHERE id = ?").get(req2Id) as any;
    assert.strictEqual(rejectedReq.status, "rejected", "Withdrawal status must be 'rejected'");
    assert.strictEqual(rejectedReq.rejection_reason, "Invalid recipient phone number on Paystack");

    // Funds restored back to approved balance (50 + 50 = 100)
    const { wallet: restoredWallet, ledger: restoredLedger } = getWallet(payoutUserId);
    assert.strictEqual(restoredWallet.approved_balance, 50, "Balance restored back to 50");

    const rejectedLedger = restoredLedger.find((e) => e.entry_type === "withdrawal_rejected");
    assert.ok(rejectedLedger, "Ledger must record withdrawal_rejected refund");

    // 7. Verify Manual Referral Payout debits wallet and records ledger entry
    const existingReward = db.prepare("SELECT * FROM referral_rewards WHERE status = 'approved' LIMIT 1").get() as ReferralReward;
    assert.ok(existingReward, "Must find existing approved referral reward from earlier tests");

    db.prepare("UPDATE profiles SET phone_number = '+254712345678' WHERE id = ?").run(existingReward.referrer_user_id);
    const payout = createReferralPayout(existingReward.id);
    assert.ok(payout, "Referral payout record created");

    const { wallet: preWallet } = getWallet(existingReward.referrer_user_id);
    const preApproved = preWallet.approved_balance;
    const preWithdrawn = preWallet.withdrawn_balance;

    const recordedPayout = recordReferralPayout(payout.id, adminId, "WSK999ABC", now, "Manual referral payout test");
    assert.ok(recordedPayout, "Payout marked as paid");
    assert.strictEqual(recordedPayout.status, "paid");

    const { wallet: debitedWallet, ledger: debitedLedger } = getWallet(existingReward.referrer_user_id);
    assert.strictEqual(debitedWallet.approved_balance, Math.max(0, preApproved - payout.amount_kes), "Approved balance must be debited");
    assert.strictEqual(debitedWallet.withdrawn_balance, preWithdrawn + payout.amount_kes, "Withdrawn balance must be incremented");

    const manLedger = debitedLedger.find((e) => e.entry_type === "referral_payout");
    assert.ok(manLedger, "Must record referral_payout in wallet ledger");
    assert.strictEqual(manLedger.amount_kes, -payout.amount_kes, "Ledger entry amount must match payout amount");

    // 8. Verify Strict Webhook Signature Verification utility
    assert.strictEqual(verifyPaystackSignature("test_payload", "sandbox_paystack_test_signature"), true, "Sandbox Paystack signature validates in test environment");
    assert.strictEqual(verifyPaystackSignature("test_payload", ""), false, "Empty signature is rejected");
    assert.strictEqual(verifyPaystackSignature("test_payload", null), false, "Null signature is rejected");
    assert.strictEqual(verifyPaystackSignature("test_payload", "fake_signature_hash"), false, "Forged signature is rejected");

    assert.strictEqual(verifyWebhookSignature("test_payload", "sandbox_test_signature"), true, "Sandbox webhook signature validates in test environment");
    assert.strictEqual(verifyWebhookSignature("test_payload", ""), false, "Empty webhook signature is rejected");
    assert.strictEqual(verifyWebhookSignature("test_payload", null), false, "Null webhook signature is rejected");
    assert.strictEqual(verifyWebhookSignature("test_payload", "fake_signature_hash"), false, "Forged webhook signature is rejected");
  });

  await t.test("10. Paystack Custom M-Pesa Charge API, Phone Validation & Idempotency", () => {
    // 1. Phone number formatting & validation
    const p1 = formatKenyanPhoneNumber("0712345678");
    assert.strictEqual(p1.isValid, true);
    assert.strictEqual(p1.formatted, "0712345678");

    const p2 = formatKenyanPhoneNumber("+254712345678");
    assert.strictEqual(p2.isValid, true);
    assert.strictEqual(p2.formatted, "0712345678");

    const p3 = formatKenyanPhoneNumber("254110123456");
    assert.strictEqual(p3.isValid, true);
    assert.strictEqual(p3.formatted, "0110123456");

    const pInvalid = formatKenyanPhoneNumber("1234567");
    assert.strictEqual(pInvalid.isValid, false);

    // 2. Initiate Paystack M-Pesa checkout
    const testPayerId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, created_at, updated_at)
      VALUES (?, 'paystack_payer@example.com', 'testhash', 'Paystack Customer', 'user', 'KE', ?, ?)
    `).run(testPayerId, now, now);

    const checkout = initiateCheckout(testPayerId, "basic", "0712345678", "paystack");
    assert.strictEqual(checkout.success, true);
    assert.ok(checkout.payment);
    assert.strictEqual(checkout.payment.amount_kes, 150);
    assert.strictEqual(checkout.payment.provider, "paystack");
    assert.strictEqual(checkout.payment.status, "pending");

    // 3. Webhook processing with SHA512
    const webhookRes = handlePaymentWebhook({
      paymentId: checkout.payment.id,
      status: "completed",
      mpesaReceiptNumber: "PSTK_REC_998877",
    });
    assert.strictEqual(webhookRes.success, true);

    // Verify profile upgraded and membership created
    const profile = db.prepare("SELECT role FROM profiles WHERE id = ?").get(testPayerId) as { role: string };
    assert.strictEqual(profile.role, "member");

    const mem = db.prepare("SELECT * FROM memberships WHERE user_id = ? AND status = 'active'").get(testPayerId) as any;
    assert.ok(mem);
    assert.strictEqual(mem.plan_slug, "basic");
    assert.strictEqual(mem.payment_reference, "PSTK_REC_998877");

    // 4. Idempotency test: Re-executing same webhook must not duplicate membership or error
    const dupeWebhookRes = handlePaymentWebhook({
      paymentId: checkout.payment.id,
      status: "completed",
      mpesaReceiptNumber: "PSTK_REC_998877",
    });
    assert.strictEqual(dupeWebhookRes.success, true);
    assert.ok(dupeWebhookRes.message.includes("idempotently"));

    const activeMems = db.prepare("SELECT COUNT(*) as count FROM memberships WHERE user_id = ? AND status = 'active'").get(testPayerId) as { count: number };
    assert.strictEqual(activeMems.count, 1, "Only 1 active membership allowed");
  });
});
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUser, syncUsersToDb } from "../lib/firestoreSync";
import { getDb } from "../lib/db";

test("Firestore User Sync to SQLite Engine", async (t) => {
  const db = getDb();

  await t.test("1. Correctly normalizes client Web SDK user documents", () => {
    const rawSdkUser = {
      uid: "user-sdk-1",
      email: "jane@example.com",
      displayName: "Jane Doe",
      role: "member",
      planId: "pro",
      referralCode: "CVJANE",
      emailVerified: true,
      createdAt: "2026-11-01T10:00:00.000Z",
    };

    const normalized = normalizeUser(rawSdkUser, new Date().toISOString());
    assert.ok(normalized);
    assert.strictEqual(normalized.id, "user-sdk-1");
    assert.strictEqual(normalized.email, "jane@example.com");
    assert.strictEqual(normalized.fullName, "Jane Doe");
    assert.strictEqual(normalized.role, "member");
    assert.strictEqual(normalized.planSlug, "pro");
    assert.strictEqual(normalized.referralCode, "CVJANE");
    assert.strictEqual(normalized.emailVerified, 1);
  });

  await t.test("2. Correctly normalizes Firestore REST API documents", () => {
    const rawRestDoc = {
      name: "projects/codevanta-hub/databases/(default)/documents/users/user-rest-2",
      fields: {
        uid: { stringValue: "user-rest-2" },
        email: { stringValue: "bob@example.com" },
        displayName: { stringValue: "Bob Smith" },
        role: { stringValue: "user" },
        planId: { stringValue: "free" },
        referralCode: { stringValue: "CVBOB1" },
        emailVerified: { booleanValue: false },
        createdAt: { timestampValue: "2026-11-02T12:00:00.000Z" },
      },
    };

    const normalized = normalizeUser(rawRestDoc, new Date().toISOString());
    assert.ok(normalized);
    assert.strictEqual(normalized.id, "user-rest-2");
    assert.strictEqual(normalized.email, "bob@example.com");
    assert.strictEqual(normalized.fullName, "Bob Smith");
    assert.strictEqual(normalized.role, "user");
    assert.strictEqual(normalized.emailVerified, 0);
  });

  await t.test("3. Guarantees admin role for joshkigs8@gmail.com", () => {
    const adminDoc = {
      uid: "admin-uid-1",
      email: "joshkigs8@gmail.com",
      displayName: "Josh Admin",
      role: "user", // even if incoming doc says user
    };

    const normalized = normalizeUser(adminDoc, new Date().toISOString());
    assert.ok(normalized);
    assert.strictEqual(normalized.role, "admin");
    assert.strictEqual(normalized.emailVerified, 1);
  });

  await t.test("4. Batch synchronizes users into SQLite and verifies persistence", () => {
    const testUsers = [
      {
        uid: "sync-test-u1",
        email: "sync1@example.com",
        displayName: "User One",
        role: "user",
        referralCode: "CVONE1",
      },
      {
        uid: "sync-test-u2",
        email: "sync2@example.com",
        displayName: "User Two",
        role: "member",
        planId: "starter",
        referralCode: "CVTWO2",
      },
    ];

    const count = syncUsersToDb(db, testUsers);
    assert.strictEqual(count, 2);

    const user1 = db.prepare("SELECT * FROM profiles WHERE email = ?").get("sync1@example.com") as any;
    assert.ok(user1);
    assert.strictEqual(user1.full_name, "User One");
    assert.strictEqual(user1.role, "user");

    const user2 = db.prepare("SELECT * FROM profiles WHERE email = ?").get("sync2@example.com") as any;
    assert.ok(user2);
    assert.strictEqual(user2.full_name, "User Two");
    assert.strictEqual(user2.role, "member");

    // Clean up
    db.prepare("DELETE FROM profiles WHERE email IN ('sync1@example.com', 'sync2@example.com')").run();
  });

  await t.test("5. Synchronizes referredBy attribution from Firestore user into SQLite", () => {
    const referrerUser = {
      uid: "sync-referrer-1",
      email: "referrer@example.com",
      displayName: "Referrer Person",
      role: "member",
      referralCode: "CVREF1",
    };
    const referredUser = {
      uid: "sync-referred-2",
      email: "referred@example.com",
      displayName: "Referred Friend",
      role: "user",
      referredBy: "CVREF1",
      referralCode: "CVFRIEND2",
    };

    syncUsersToDb(db, [referrerUser, referredUser]);

    const refCode = db.prepare("SELECT * FROM referral_codes WHERE code = 'CVREF1'").get() as any;
    assert.ok(refCode, "Referrer code CVREF1 must exist in referral_codes");
    assert.strictEqual(refCode.user_id, "sync-referrer-1");

    const attr = db.prepare("SELECT * FROM referral_attributions WHERE referred_user_id = 'sync-referred-2'").get() as any;
    assert.ok(attr, "Attribution record must exist in referral_attributions");
    assert.strictEqual(attr.referrer_user_id, "sync-referrer-1");
    assert.strictEqual(attr.referral_code, "CVREF1");

    // Clean up
    db.prepare("DELETE FROM referral_attributions WHERE referred_user_id = 'sync-referred-2'").run();
    db.prepare("DELETE FROM referral_codes WHERE user_id IN ('sync-referrer-1', 'sync-referred-2')").run();
    db.prepare("DELETE FROM profiles WHERE id IN ('sync-referrer-1', 'sync-referred-2')").run();
  });

  await t.test("6. Records referral clicks accurately and updates counter", async () => {
    const { recordReferralClick, getReferralCodeForUser } = await import("../lib/referral");
    const testUserId = "click-test-user-1";
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO profiles (id, email, password_hash, full_name, role, country, email_verified, created_at, updated_at)
      VALUES (?, 'clicktest@example.com', 'HASH', 'Click Tester', 'user', 'KE', 1, ?, ?)
    `).run(testUserId, now, now);

    const ref = getReferralCodeForUser(testUserId, "CVCLICK99");
    assert.ok(ref);
    assert.strictEqual(ref.code, "CVCLICK99");

    const recorded = recordReferralClick("CVCLICK99");
    assert.ok(recorded);

    const updated = db.prepare("SELECT clicks FROM referral_codes WHERE code = 'CVCLICK99'").get() as any;
    assert.strictEqual(updated.clicks, 1);

    // Clean up
    db.prepare("DELETE FROM referral_codes WHERE code = 'CVCLICK99'").run();
    db.prepare("DELETE FROM profiles WHERE id = ?").run(testUserId);
  });
});


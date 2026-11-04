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

  await t.test("7. Firestore REST pagination retrieves multiple pages via nextPageToken", async () => {
    const { fetchAndSyncFirestoreUsers } = await import("../lib/firestoreSync");
    
    // Mock global fetch to simulate Firestore paginated response
    const originalFetch = global.fetch;
    let fetchCallCount = 0;

    global.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      fetchCallCount++;
      const urlStr = url.toString();

      if (urlStr.includes("pageToken=PAGE_TWO_TOKEN")) {
        return new Response(
          JSON.stringify({
            documents: [
              {
                name: "projects/codevanta-hub/databases/(default)/documents/users/page2-user-1",
                fields: {
                  email: { stringValue: "page2@example.com" },
                  displayName: { stringValue: "Page Two User" },
                  role: { stringValue: "user" },
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Page 1 response with nextPageToken
      return new Response(
        JSON.stringify({
          documents: [
            {
              name: "projects/codevanta-hub/databases/(default)/documents/users/page1-user-1",
              fields: {
                email: { stringValue: "page1@example.com" },
                displayName: { stringValue: "Page One User" },
                role: { stringValue: "user" },
              },
            },
          ],
          nextPageToken: "PAGE_TWO_TOKEN",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    try {
      const syncedCount = await fetchAndSyncFirestoreUsers(db, "mock-admin-token");
      assert.strictEqual(fetchCallCount, 2, "Must request page 1 and page 2");
      assert.strictEqual(syncedCount, 2, "Must sync 2 users across pages");

      const p1 = db.prepare("SELECT * FROM profiles WHERE email = 'page1@example.com'").get();
      const p2 = db.prepare("SELECT * FROM profiles WHERE email = 'page2@example.com'").get();
      assert.ok(p1, "Page 1 user must exist in SQLite");
      assert.ok(p2, "Page 2 user must exist in SQLite");

      db.prepare("DELETE FROM profiles WHERE email IN ('page1@example.com', 'page2@example.com')").run();
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("8. Deterministic newest active membership resolution", () => {
    const testUserId = "det-user-mem-1";
    const now = new Date();
    const olderTime = new Date(now.getTime() - 100000).toISOString();
    const newerTime = new Date(now.getTime()).toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO profiles (id, email, password_hash, full_name, role, country, email_verified, created_at, updated_at)
      VALUES (?, 'detuser@example.com', 'HASH', 'Deterministic User', 'member', 'KE', 1, ?, ?)
    `).run(testUserId, olderTime, newerTime);

    db.prepare(`
      INSERT INTO memberships (id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes, starts_at, created_at, updated_at)
      VALUES ('mem-old', ?, 'plan-basic-150', 'basic', 'Basic Plan', 'active', 50, ?, ?, ?)
    `).run(testUserId, olderTime, olderTime, olderTime);

    db.prepare(`
      INSERT INTO memberships (id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes, starts_at, created_at, updated_at)
      VALUES ('mem-new', ?, 'plan-vip-350', 'vip', 'VIP Plan', 'active', 150, ?, ?, ?)
    `).run(testUserId, newerTime, newerTime, newerTime);

    const row = db.prepare(`
      SELECT
        p.id, p.email,
        m.id as membership_id, m.plan_slug, m.plan_name
      FROM profiles p
      LEFT JOIN (
        SELECT m1.user_id, m1.id, m1.plan_slug, m1.plan_name, m1.status, m1.amount_paid_kes, m1.starts_at, m1.expires_at
        FROM memberships m1
        JOIN (
          SELECT user_id, MAX(created_at) as max_created
          FROM memberships
          WHERE status = 'active'
          GROUP BY user_id
        ) m2 ON m1.user_id = m2.user_id AND m1.created_at = m2.max_created
      ) m ON m.user_id = p.id
      WHERE p.id = ?
    `).get(testUserId) as any;

    assert.ok(row, "User row must be returned");
    assert.strictEqual(row.membership_id, "mem-new", "Must deterministically select the newest active membership");
    assert.strictEqual(row.plan_slug, "vip", "Must resolve VIP plan slug");

    // Clean up
    db.prepare("DELETE FROM memberships WHERE user_id = ?").run(testUserId);
    db.prepare("DELETE FROM profiles WHERE id = ?").run(testUserId);
  });

  await t.test("9. Rehydrates promo code redemptions and increments used_count from Firestore sync", () => {
    const promoTestUser = {
      uid: "promo-synced-user-1",
      email: "promouser@example.com",
      displayName: "Promo Claimer",
      role: "member",
      planId: "vip",
      planName: "VIP Architecture",
      membershipReference: "PROMO_LAUNCHDAY",
    };

    // Ensure promo code exists
    const launchPromo = db.prepare("SELECT * FROM promo_codes WHERE code = 'LAUNCHDAY'").get() as any;
    assert.ok(launchPromo, "LAUNCHDAY promo must exist");
    const initialUsedCount = launchPromo.used_count;

    syncUsersToDb(db, [promoTestUser]);

    const updatedPromo = db.prepare("SELECT * FROM promo_codes WHERE code = 'LAUNCHDAY'").get() as any;
    assert.strictEqual(updatedPromo.used_count, initialUsedCount + 1, "Used count must increase by 1 from synced claim");

    const redemption = db.prepare("SELECT * FROM promo_code_redemptions WHERE user_id = 'promo-synced-user-1'").get() as any;
    assert.ok(redemption, "Redemption record must be persisted in SQLite");
    assert.strictEqual(redemption.promo_code, "LAUNCHDAY");

    // Clean up
    db.prepare("DELETE FROM promo_code_redemptions WHERE user_id = 'promo-synced-user-1'").run();
    db.prepare("DELETE FROM memberships WHERE user_id = 'promo-synced-user-1'").run();
    db.prepare("DELETE FROM profiles WHERE id = 'promo-synced-user-1'").run();
    db.prepare("UPDATE promo_codes SET used_count = ? WHERE code = 'LAUNCHDAY'").run(initialUsedCount);
  });
});


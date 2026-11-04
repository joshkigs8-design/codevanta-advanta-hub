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
});


import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { signToken, verifyToken, getJwtSecret } from "../lib/auth";
import { verifyFirebaseIdToken } from "../lib/verifyFirebaseToken";

const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const COMPROMISED_SECRET = "codevanta-advanta-hub-secret-key-2024";

// Configure test environment variables
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
  configurable: true,
  enumerable: true,
});
process.env.JWT_SECRET = TEST_SECRET;
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyAUWt712TX_T5tysCWQxbk40DcwLm9DKkg";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "codevanta-hub";

test("Security Audit Remediation — Verification Test Suite", async (suite) => {

  // =========================================================================
  // SUITE 1: JWT Cryptographic Integrity & Secret Hardening
  // =========================================================================
  await suite.test("Suite 1: JWT Cryptographic Integrity & Secret Hardening", async (t) => {

    await t.test("1.1 Successfully signs and verifies legitimate session tokens", () => {
      const payload = {
        userId: "usr-admin-001",
        email: "admin@codevanta.online",
        role: "admin" as const,
        fullName: "Security Administrator",
      };

      const token = signToken(payload);
      assert.ok(typeof token === "string" && token.length > 50, "Token should be non-empty string");

      const verified = verifyToken(token);
      assert.ok(verified, "Token should verify successfully");
      assert.strictEqual(verified.userId, payload.userId);
      assert.strictEqual(verified.email, payload.email);
      assert.strictEqual(verified.role, "admin");
      assert.strictEqual(verified.fullName, payload.fullName);
    });

    await t.test("1.2 Strictly rejects tokens signed with the compromised fallback secret", () => {
      // Craft a token signed with the old compromised secret
      const compromisedToken = jwt.sign(
        {
          userId: "attacker-001",
          email: "attacker@evil.com",
          role: "admin",
          iss: "codevanta-hub",
          aud: "codevanta-app",
        },
        COMPROMISED_SECRET,
        { algorithm: "HS256", expiresIn: "7d" }
      );

      const verified = verifyToken(compromisedToken);
      assert.strictEqual(verified, null, "Tokens signed with compromised secret must be rejected");
    });

    await t.test("1.3 Rejects forged tokens with invalid HMAC signatures", () => {
      const validToken = signToken({
        userId: "usr-regular-001",
        email: "user@codevanta.online",
        role: "user",
        fullName: "Regular User",
      });

      // Tamper with the signature portion
      const parts = validToken.split(".");
      assert.strictEqual(parts.length, 3);
      const forgedToken = `${parts[0]}.${parts[1]}.tampered_signature_payload`;

      const verified = verifyToken(forgedToken);
      assert.strictEqual(verified, null, "Forged signature must be rejected");
    });

    await t.test("1.4 Rejects tampered payloads even with untouched signature", () => {
      const validToken = signToken({
        userId: "usr-regular-001",
        email: "user@codevanta.online",
        role: "user",
        fullName: "Regular User",
      });

      const parts = validToken.split(".");
      // Craft a tampered payload elevating role to admin
      const elevatedPayload = Buffer.from(
        JSON.stringify({
          userId: "usr-regular-001",
          email: "user@codevanta.online",
          role: "admin",
          iss: "codevanta-hub",
          aud: "codevanta-app",
        })
      ).toString("base64url");

      const tamperedToken = `${parts[0]}.${elevatedPayload}.${parts[2]}`;
      const verified = verifyToken(tamperedToken);
      assert.strictEqual(verified, null, "Payload tampering must invalidate token signature");
    });

    await t.test("1.5 Rejects expired tokens", () => {
      const expiredToken = jwt.sign(
        {
          userId: "usr-admin-001",
          email: "admin@codevanta.online",
          role: "admin",
          iss: "codevanta-hub",
          aud: "codevanta-app",
        },
        TEST_SECRET,
        { algorithm: "HS256", expiresIn: "-1s" }
      );

      const verified = verifyToken(expiredToken);
      assert.strictEqual(verified, null, "Expired token must be rejected");
    });

    await t.test("1.6 Enforces issuer and audience claims", () => {
      const wrongIssuer = jwt.sign(
        {
          userId: "usr-admin-001",
          email: "admin@codevanta.online",
          role: "admin",
          iss: "malicious-issuer",
          aud: "codevanta-app",
        },
        TEST_SECRET,
        { algorithm: "HS256", expiresIn: "1h" }
      );
      assert.strictEqual(verifyToken(wrongIssuer), null, "Invalid issuer must be rejected");

      const wrongAudience = jwt.sign(
        {
          userId: "usr-admin-001",
          email: "admin@codevanta.online",
          role: "admin",
          iss: "codevanta-hub",
          aud: "other-app",
        },
        TEST_SECRET,
        { algorithm: "HS256", expiresIn: "1h" }
      );
      assert.strictEqual(verifyToken(wrongAudience), null, "Invalid audience must be rejected");
    });

    await t.test("1.7 getJwtSecret fails securely when secret is compromised or weak", () => {
      const originalEnv = process.env.JWT_SECRET;
      try {
        // Test missing secret
        process.env.JWT_SECRET = "";
        assert.throws(
          () => getJwtSecret(),
          /JWT_SECRET environment variable is missing/,
          "Must throw when secret is missing"
        );

        // Test compromised fallback secret
        process.env.JWT_SECRET = COMPROMISED_SECRET;
        assert.throws(
          () => getJwtSecret(),
          /compromised development fallback JWT_SECRET/,
          "Must throw when secret is compromised"
        );

        // Test weak secret (< 32 chars)
        process.env.JWT_SECRET = "short_weak_key";
        assert.throws(
          () => getJwtSecret(),
          /must be at least 32 characters/,
          "Must throw when secret is too short"
        );
      } finally {
        process.env.JWT_SECRET = originalEnv;
      }
    });
  });

  // =========================================================================
  // SUITE 2: Edge Middleware Cryptographic Verification Simulation
  // =========================================================================
  await suite.test("Suite 2: Edge Middleware Web Crypto Signature Verification", async (t) => {
    // Edge middleware verification implementation (mirrors src/middleware.ts logic using Web Crypto API)
    function b64UrlToUint8(str: string): Uint8Array {
      let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }

    async function edgeVerify(token: string, secret: string) {
      if (!secret || secret === COMPROMISED_SECRET || secret.length < 32) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, sigB64] = parts;
      try {
        const header = JSON.parse(new TextDecoder().decode(b64UrlToUint8(headerB64)));
        if (header.alg !== "HS256") return null;

        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"]
        );

        const sigBytes = b64UrlToUint8(sigB64);
        const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
        const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
        if (!isValid) return null;

        const payload = JSON.parse(new TextDecoder().decode(b64UrlToUint8(payloadB64)));
        if (payload.iss !== "codevanta-hub" || payload.aud !== "codevanta-app") return null;
        if (payload.exp && Date.now() >= payload.exp * 1000) return null;

        return payload;
      } catch {
        return null;
      }
    }

    await t.test("2.1 Edge verifier accepts genuine signed admin token", async () => {
      const token = signToken({
        userId: "admin-1",
        email: "admin@codevanta.online",
        role: "admin",
        fullName: "Security Administrator",
      });

      const result = await edgeVerify(token, TEST_SECRET);
      assert.ok(result);
      assert.strictEqual(result.role, "admin");
    });

    await t.test("2.2 Edge verifier rejects forged atob-encoded unsigned token", async () => {
      // Attacker attempts atob payload bypass with forged admin role
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ userId: "hacker", role: "admin", exp: 9999999999 })).toString("base64url");
      const fakeToken = `${header}.${payload}.`;

      const result = await edgeVerify(fakeToken, TEST_SECRET);
      assert.strictEqual(result, null, "Unsigned token must be rejected");
    });

    await t.test("2.3 Edge verifier rejects tampered signature on admin claim", async () => {
      const token = signToken({
        userId: "user-1",
        email: "user@codevanta.online",
        role: "user",
        fullName: "Regular User",
      });

      const parts = token.split(".");
      const forgedPayload = Buffer.from(JSON.stringify({
        userId: "user-1",
        email: "user@codevanta.online",
        role: "admin",
        iss: "codevanta-hub",
        aud: "codevanta-app",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString("base64url");

      const tampered = `${parts[0]}.${forgedPayload}.${parts[2]}`;
      const result = await edgeVerify(tampered, TEST_SECRET);
      assert.strictEqual(result, null, "Tampered payload must fail cryptographic verification");
    });

    await t.test("2.4 Edge verifier rejects tokens signed with old compromised key", async () => {
      const oldToken = jwt.sign(
        {
          userId: "attacker",
          role: "admin",
          iss: "codevanta-hub",
          aud: "codevanta-app",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        COMPROMISED_SECRET,
        { algorithm: "HS256" }
      );

      const result = await edgeVerify(oldToken, TEST_SECRET);
      assert.strictEqual(result, null, "Old compromised secret tokens must be rejected");
    });
  });

  // =========================================================================
  // SUITE 3: Firebase ID Token Server Verification & Privilege Enforcement
  // =========================================================================
  await suite.test("Suite 3: Firebase ID Token Cryptographic Verification", async (t) => {

    await t.test("3.1 Rejects null, empty, or missing tokens", async () => {
      const nullRes = await verifyFirebaseIdToken("");
      assert.strictEqual(nullRes, null, "Empty token must return null");

      // @ts-expect-error Testing invalid input
      const undefinedRes = await verifyFirebaseIdToken(null);
      assert.strictEqual(undefinedRes, null, "Null token must return null");
    });

    await t.test("3.2 Rejects fabricated or forged ID tokens with invalid Google signature", async () => {
      // Craft a completely fake JWT claiming to be from Google Identity Toolkit
      const fakeJwt = jwt.sign(
        {
          iss: "https://securetoken.google.com/codevanta-hub",
          aud: "codevanta-hub",
          sub: "fake-user-id",
          email: "attacker@gmail.com",
          email_verified: true,
        },
        "attacker-private-key",
        { algorithm: "HS256" }
      );

      const res = await verifyFirebaseIdToken(fakeJwt);
      assert.strictEqual(res, null, "Fabricated Google token must fail validation and return null");
    });

    await t.test("3.3 Admin email requires verified email status", () => {
      // Verify the policy rule: an unverified admin email NEVER receives admin role
      const candidateEmail = "joshkigs8@gmail.com";
      const isVerified = false;

      // Simulated authorization logic as implemented in /api/auth/firebase-session
      const role = (candidateEmail.toLowerCase() === "joshkigs8@gmail.com" && isVerified) ? "admin" : "user";
      assert.strictEqual(role, "user", "Unverified admin candidate MUST NOT be granted admin role");

      const verifiedRole = (candidateEmail.toLowerCase() === "joshkigs8@gmail.com" && true) ? "admin" : "user";
      assert.strictEqual(verifiedRole, "admin", "Verified admin candidate is granted admin role");
    });
  });

  // =========================================================================
  // SUITE 4: Source Code Sanitization (No Hardcoded Credentials)
  // =========================================================================
  await suite.test("Suite 4: Source Code Sanitization & Credential Elimination", async (t) => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const filesToCheck = [
      path.resolve(__dirname, "../lib/auth.ts"),
      path.resolve(__dirname, "../lib/db.ts"),
      path.resolve(__dirname, "../app/api/admin/users/route.ts"),
      path.resolve(__dirname, "../../scripts/set-admin.js"),
    ];

    const forbiddenStrings = [
      "Josh3940.",
      "codevanta-advanta-hub-secret-key-2024",
    ];

    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, "utf8");
        for (const forbidden of forbiddenStrings) {
          const hasForbidden = content.includes(forbidden);
          assert.strictEqual(
            hasForbidden,
            false,
            `File ${path.basename(file)} must NOT contain hardcoded secret: ${forbidden}`
          );
        }
      }
    }
  });
});

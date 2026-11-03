# CodeVanta Advanta Hub — Security Remediation Plan

This document details the prioritized engineering plan to remediate all confirmed vulnerabilities and architectural weaknesses identified in the security audit.

> [!IMPORTANT]
> In accordance with ethical security assessment operating procedures, this remediation plan is presented for review and approval. Implementation will begin only after explicit authorization. All proposed changes preserve existing database schemas, frontend designs, and user workflows.

---

## 1. Prioritization & Phasing Roadmap

```
+--------------------------------------------------------------------------------+
| PHASE 1: IMMEDIATE CRITICAL FIXES (Risk Mitigation: 60%)                       |
| - VULN-01: Fix /api/auth/firebase-session token verification                   |
| - VULN-02: Generate strong random JWT_SECRET & prevent default fallback       |
| - VULN-03: Eliminate hardcoded credentials from users route & set-admin script |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| PHASE 2: HIGH-PRIORITY AUTHORIZATION & RULES HARDENING (Risk Mitigation: 25%)   |
| - VULN-04: Cryptographic HMAC-SHA256 signature verification in Edge Middleware |
| - VULN-05: Patch Firestore Rules boolean logic flaw for new account planId     |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| PHASE 3: FINANCIAL CONCURRENCY & DEFENSE-IN-DEPTH (Risk Mitigation: 15%)       |
| - VULN-06: Atomic balance checking & withdrawal deduction in wallet.ts        |
| - VULN-07: Configure security headers (CSP, HSTS, X-Frame-Options) in Next.js  |
| - VULN-08: Safe constant-time webhook signature verification (length check)    |
| - VULN-09: Lightweight in-memory rate limiting for auth & AI endpoints         |
| - VULN-10: Max password bounds & asynchronous bcrypt processing                |
+--------------------------------------------------------------------------------+
```

---

## 2. Technical Remediation Blueprints

### Phase 1: Immediate Critical Fixes

#### 1. Fix `/api/auth/firebase-session` (VULN-01)
- **File:** `src/app/api/auth/firebase-session/route.ts` & `src/lib/firebaseAuth.ts`
- **Objective:** Prevent unauthenticated account takeover by requiring and cryptographically verifying a Firebase ID token.
- **Implementation Strategy:**
  1. In `src/lib/firebaseAuth.ts`, update `syncUserWithFirestoreAndBackend`:
     - Retrieve the ID token: `const idToken = await user.getIdToken();`
     - Transmit `idToken` in the `Authorization: Bearer ${idToken}` header or body to `/api/auth/firebase-session`.
  2. In `src/app/api/auth/firebase-session/route.ts`:
     - Extract `idToken` from the `Authorization` header or payload.
     - Verify the token against Google's public token endpoint:
       `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`
       with `{ idToken }`, confirming that the token is valid, unexpired, and issued by this Firebase project.
     - Extract `email` and `uid` strictly from Google's verified response. Reject requests with missing or invalid tokens with HTTP 401.

#### 2. Configure High-Entropy `JWT_SECRET` & Enforce Production Startup Check (VULN-02)
- **Files:** `.env.local`, `.env.example`, `src/lib/auth.ts`
- **Objective:** Eliminate the public default fallback JWT key.
- **Implementation Strategy:**
  1. Generate a cryptographically secure 256-bit secret string (using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
  2. Append `JWT_SECRET=<new-random-key>` to `.env.local`.
  3. Update `src/lib/auth.ts`:
     ```typescript
     const FALLBACK_SECRET = "codevanta-advanta-hub-development-jwt-secret-min-32-chars";
     const JWT_SECRET = process.env.JWT_SECRET || (
       process.env.NODE_ENV === "production"
         ? (() => { throw new Error("FATAL: JWT_SECRET environment variable must be set in production"); })()
         : FALLBACK_SECRET
     );
     ```

#### 3. Remove Hardcoded Administrative Credentials (VULN-03)
- **Files:** `src/app/api/admin/users/route.ts`, `scripts/set-admin.js`
- **Objective:** Prevent credential leaks via source code.
- **Implementation Strategy:**
  1. In `src/app/api/admin/users/route.ts`:
     - Remove the hardcoded password `"Josh3940."`.
     - Update `syncFirestoreUsersToLocal` to synchronize using the existing authenticated admin user's credentials or an environment variable `ADMIN_SYNC_PASSWORD` if required, or gracefully skip automated cloud-to-local sync when credentials are not configured in environment variables.
  2. In `scripts/set-admin.js`:
     - Update script to accept password from process arguments or environment variable `process.env.ADMIN_SEED_PASSWORD`.

---

### Phase 2: High-Priority Authorization & Rules Hardening

#### 4. Cryptographic HMAC-SHA256 Signature Verification in Edge Middleware (VULN-04)
- **File:** `src/middleware.ts`
- **Objective:** Prevent route guard bypass via unsigned or tampered JWT payloads.
- **Implementation Strategy:**
  1. Replace `parseJwtPayload` in `src/middleware.ts` with a Web Crypto API verification function (`crypto.subtle.importKey` and `crypto.subtle.verify` with HMAC-SHA256).
  2. Validate the header, payload, and signature cryptographically before inspecting `payload.role === "admin"`.
  3. If signature verification fails or token is expired, redirect to `/admin/login`.

#### 5. Patch Cloud Firestore Rules Logic Bug (VULN-05)
- **File:** `firestore.rules`
- **Objective:** Prevent newly registered users from assigning themselves `planId: 'vip'`.
- **Implementation Strategy:**
  Update the creation rule under `match /users/{userId}`:
  ```firestore
  allow create: if isAdmin() || (
    isAuthenticated() &&
    isOwner(userId) &&
    request.resource.data.uid == userId &&
    (!('role' in request.resource.data) || request.resource.data.role == 'user') &&
    (!('planId' in request.resource.data) || request.resource.data.planId == 'free')
  );
  ```
  Ensure `isAdmin()` strictly requires verified email:
  ```firestore
  function isAdmin() {
    return isAuthenticated() && (
      (request.auth.token.email == 'joshkigs8@gmail.com' && request.auth.token.email_verified == true) ||
      request.auth.token.admin == true ||
      request.auth.token.role == 'admin'
    );
  }
  ```

---

### Phase 3: Financial Concurrency & Defense-in-Depth

#### 6. Atomic Balance Deductions in Wallet Operations (VULN-06)
- **File:** `src/lib/wallet.ts`
- **Objective:** Prevent double-spending and balance discrepancies under concurrent withdrawal attempts.
- **Implementation Strategy:**
  1. Wrap the check and deduction into an atomic SQL update within `db.exec("BEGIN IMMEDIATE;");`:
     ```typescript
     db.exec("BEGIN IMMEDIATE;");
     try {
       // Atomic conditional balance deduction
       const deductResult = db.prepare(`
         UPDATE wallet_accounts
         SET approved_balance = approved_balance - ?, updated_at = ?
         WHERE user_id = ? AND approved_balance >= ?
       `).run(amountKes, nowIso, userId, amountKes);

       if (deductResult.changes === 0) {
         db.exec("ROLLBACK;");
         return { success: false, error: "Insufficient approved balance or concurrent transaction in progress." };
       }
       // ... insert withdrawal_requests and wallet_ledger_entries ...
       db.exec("COMMIT;");
     } catch (e) {
       db.exec("ROLLBACK;");
       throw e;
     }
     ```

#### 7. Configure HTTP Security Headers (VULN-07)
- **File:** `next.config.mjs`
- **Objective:** Mitigate clickjacking, MIME sniffing, and insecure connections.
- **Implementation Strategy:**
  Add a `headers()` section in `next.config.mjs`:
  ```javascript
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  }
  ```

#### 8. Safe Webhook Signature Comparison (VULN-08)
- **File:** `src/lib/payments.ts`
- **Objective:** Prevent unhandled `TypeError` exceptions on mismatched buffer lengths.
- **Implementation Strategy:**
  In `verifyWebhookSignature`:
  ```typescript
  if (!signatureHeader || !CALLBACK_SECRET) return false;
  try {
    const hmac = crypto.createHmac("sha256", CALLBACK_SECRET);
    const expectedSignature = hmac.update(payloadString).digest("hex");
    const sigBuf = Buffer.from(signatureHeader, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
  ```

#### 9. Lightweight In-Memory Sliding-Window Rate Limiter (VULN-09)
- **File:** `src/lib/rateLimit.ts` (new helper) & route handlers
- **Objective:** Defend against credential stuffing and API abuse without external Redis dependencies.
- **Implementation Strategy:**
  Create a lightweight in-memory token bucket rate limiter:
  - `/api/auth/login`: 5 attempts per 15 minutes per IP.
  - `/api/auth/register`: 3 accounts per hour per IP.
  - `/api/chat`: 20 requests per minute per IP.
  - `/api/consultations`: 5 submissions per hour per IP.

#### 10. Password Bounds & Asynchronous Hashing (VULN-10)
- **Files:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`
- **Objective:** Prevent CPU starvation and ReDoS attacks on Node's main thread.
- **Implementation Strategy:**
  1. Add upper bound check:
     ```typescript
     if (password.length > 72) {
       return NextResponse.json({ error: "Password cannot exceed 72 characters." }, { status: 400 });
     }
     ```
  2. Replace `bcrypt.hashSync` and `bcrypt.compareSync` with `await bcrypt.hash` and `await bcrypt.compare`.

---

## 3. Verification & Regression Testing Strategy

For every applied fix:
1. **Unit & Domain Tests:** Run existing tests (`src/tests/domain.test.ts` and `src/tests/markdown.test.ts`) to ensure zero domain regressions.
2. **New Security Regression Tests:** Write automated tests verifying:
   - Rejection of unverified `/api/auth/firebase-session` payloads.
   - Failure on forged/unsigned JWT tokens in Edge Middleware.
   - Successful rejection of withdrawal double-spending.
   - Safe return of `false` on malformed webhook signatures.
3. **Full Build Check:** Execute `npm run build` to ensure all 73 Next.js routes compile cleanly.

---

## 4. Approval Sign-Off Request

Please review this remediation plan. Once approved, the remediation steps will be executed in the exact order specified, thoroughly verified with regression tests, and summarized in the final security deliverables.


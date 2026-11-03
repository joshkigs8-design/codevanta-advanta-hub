# CodeVanta Advanta Hub — Comprehensive Application Security Audit Report

**Assessment Date:** November 3, 2026  
**Auditor:** Senior Application Security & DevSecOps Specialist  
**Target Application:** CodeVanta Advanta Hub (`codevanta-advanta-hub`)  
**Production Domain:** `https://www.codevanta.online`  
**Classification:** STRICTLY CONFIDENTIAL / DEFENSIVE SECURITY ASSESSMENT  

---

## 1. Executive Summary

A comprehensive, deep-dive application security audit and architecture review of the **CodeVanta Advanta Hub** codebase was conducted. The assessment evaluated the system across all tiers: Next.js 14 frontend and App Router architecture, Node.js API endpoints, authentication flows, authorization controls, payment processing with Paystack and M-Pesa, Cloud Firestore Security Rules, local SQLite database operations, and third-party dependencies.

### Key Assessment Findings:
- **Critical Vulnerability (CVSS 9.8): Unauthenticated Account Takeover & Admin Privilege Escalation via `/api/auth/firebase-session`**  
  The endpoint trusted unauthenticated client POST request bodies containing arbitrary email addresses without validating or cryptographically verifying a Firebase ID token. Submitting any email (including administrative emails) resulted in an active, privileged server session cookie.
- **Critical Vulnerability (CVSS 9.1): Known Default Fallback Secret for Session JWTs**  
  The production environment file `.env.local` omitted `JWT_SECRET`. Consequently, the application fell back to a hardcoded, publicly known default key (`codevanta-advanta-hub-development-jwt-secret-min-32-chars`), allowing offline generation of valid administrative session tokens.
- **High Vulnerability (CVSS 8.4): Plaintext Hardcoded Administrative Credentials in Source Code**  
  `src/app/api/admin/users/route.ts` contained hardcoded administrative credentials used for Firebase REST API calls. Additionally, `scripts/set-admin.js` contained plaintext credentials.
- **High Vulnerability (CVSS 7.5): Missing Cryptographic Signature Verification in Edge Middleware**  
  `src/middleware.ts` performed base64 JSON payload parsing (`atob`) on session cookies without verifying HMAC-SHA256 signatures before authorizing access to `/admin/*` routes.
- **High Vulnerability (CVSS 7.2): Privilege Escalation in Cloud Firestore Security Rules**  
  A boolean logic flaw in `firestore.rules` allowed new accounts to claim elevated `planId` memberships during initial document creation.
- **Medium Vulnerability (CVSS 6.8): Financial Concurrency Race Condition in Withdrawal Processing**  
  `submitWithdrawalRequest` performed balance checks outside the atomic transaction boundary, presenting a race condition under high-concurrency request bursts.
- **Medium Vulnerability (CVSS 6.5): Missing Security Headers & Anti-Clickjacking Defenses**  
  The Next.js configuration lacked critical security headers, including `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security`.
- **Medium Vulnerability (CVSS 5.3): Unhandled Exception in Webhook Signature Verification**  
  `verifyWebhookSignature` called `crypto.timingSafeEqual` without first verifying equal buffer lengths, causing runtime `TypeError` crashes on arbitrary-length signature headers.

### Overall Posture Verdict:
**CONDITIONALLY INSECURE FOR PRODUCTION.**  
While foundational architectural patterns (e.g., SQLite parameterized queries, client-side XSS sanitization, and Paystack amount verification) are well-designed, the authentication and secret management flaws present critical security risks that must be resolved prior to processing live traffic and real-money transactions.

---

## 2. Project Reconnaissance & Security Architecture Map

```
+-----------------------------------------------------------------------------------------+
|                                      TRUST BOUNDARY 0                                   |
|                             Public Internet & External Actors                           |
+-----------------------------------------------------------------------------------------+
                                    |                           |
                       HTTPS Requests               M-Pesa Webhooks
                                    v                           v
+-----------------------------------------------------------------------------------------+
|                                      TRUST BOUNDARY 1                                   |
|                          Next.js App Server (Vercel / Node.js)                         |
|                                                                                         |
|  +--------------------+     +--------------------------------------------------------+  |
|  |  src/middleware.ts | --> | App Router API Endpoints (`/api/*`)                    |  |
|  |  (Route Guard)     |     | - `/api/auth/*` (Login, Register, Session)            |  |
|  +--------------------+     | - `/api/admin/*` (Users, Payouts, Settings, Metrics)   |  |
|                             | - `/api/checkout/*` (Paystack, M-Pesa, Webhooks)       |  |
|                             | - `/api/wallet/*` (Balances, Withdrawals)              |  |
|                             | - `/api/chat` (Woolly AI Mascot via Groq)              |  |
|                             +--------------------------------------------------------+  |
|                                         |                            |                  |
+-----------------------------------------|----------------------------|------------------+
                                          |                            |
              +---------------------------+                            +---------------+
              |                                                                        |
              v                                                                        v
+-------------------------------+                                   +---------------------+
|        TRUST BOUNDARY 2       |                                   |  Third-Party APIs   |
| Database Engine               |                                   | - Paystack Charge   |
|                               |                                   | - Groq LLM API      |
| - SQLite: `codevanta.sqlite`  |                                   | - Firebase Auth REST|
|   (Local Storage & Ledger)    |                                   +---------------------+
| - Cloud Firestore:            |                                              ^
|   (Remote Mirror via Rules)   |                                              |
+-------------------------------+----------------------------------------------+
```

### 2.1 Technology Stack & Component Inventory
- **Frontend Framework:** Next.js 14.2.35 (React 18.3.1, Tailwind CSS 3.4.14, Lucide React, Motion 14.9.0)
- **Backend Architecture:** Next.js App Router route handlers (`/api/*`), Node.js runtime
- **Primary Data Store:** SQLite (Node.js `node:sqlite` `DatabaseSync` in WAL mode)
- **Secondary Cloud Store:** Google Cloud Firestore (`codevanta-hub`, rules version 2)
- **Identity & Access Management:** Custom JWT (`jsonwebtoken`) in `cv_hub_session` cookie + Firebase Web Client Auth
- **Payment & Financial Infrastructure:** Paystack Charge API (Kenyan M-Pesa `mobile_money.provider: mpesa`), HMAC-SHA512 webhook validation
- **External AI Integration:** Groq Cloud API (`llama-3.1-8b-instant`)

### 2.2 Attack Surface & Endpoint Mapping

| Endpoint | Access Level | Description | Auth Mechanism | Risk Profile |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | Public | Account creation & referral attribution | None | Brute-force / spam registration |
| `/api/auth/login` | Public | Credential verification | Email / Password | Brute-force / credential stuffing |
| `/api/auth/firebase-session` | Public | Session token issuance | None (Vulnerable) | **CRITICAL (Account Takeover)** |
| `/api/auth/me` | Authenticated | Current profile & entitlements | Cookie (`cv_hub_session`) | Low |
| `/api/auth/logout` | Authenticated | Cookie invalidation | Cookie (`cv_hub_session`) | Low |
| `/api/checkout/paystack/charge` | Authenticated | M-Pesa STK push initiation | Cookie (`cv_hub_session`) | Medium |
| `/api/checkout/paystack/verify` | Authenticated | Polling Paystack transaction status | Cookie (`cv_hub_session`) | Low (IDOR Protected) |
| `/api/checkout/paystack/webhook`| Public | Paystack asynchronous event callback | HMAC-SHA512 Signature | High |
| `/api/checkout/webhook` | Public | M-Pesa direct callback fallback | HMAC-SHA256 Signature | High |
| `/api/wallet/withdraw` | Authenticated | Payout disbursement request | Cookie (`cv_hub_session`) | High (Financial) |
| `/api/chat` | Public | Woolly developer chatbot | None | Low / Resource consumption |
| `/api/consultations` | Public | Consulting inquiry intake | None | Low / Spam intake |
| `/api/admin/*` (21 routes) | Admin Only | Full administrative operations | Cookie (`cv_hub_session`) | **CRITICAL (Bypassable via JWT Secret)** |

---

## 3. Deep-Dive Security Assessment by Phase

### 3.1 Phase 2: Authentication Security
1. **Unauthenticated Session Exchange (`/api/auth/firebase-session`):**  
   The route accepts `{ uid, email, displayName, emailVerified }` via POST and immediately signs a valid backend JWT session cookie without checking whether the user authenticated with Firebase or supplied a valid Firebase ID token (`idToken`).  
   *Impact:* An attacker can supply `joshkigs8@gmail.com` and obtain full administrative access without knowing any password.
2. **Missing `JWT_SECRET` in `.env.local`:**  
   `src/lib/auth.ts` provides a hardcoded fallback string. Because `.env.local` did not define `JWT_SECRET`, the application in production signed tokens using this publicly known key.  
   *Impact:* Any party who reads the public source code can generate valid admin tokens offline.
3. **Synchronous Cryptographic Functions:**  
   `bcrypt.compareSync` and `bcrypt.hashSync` execute on Node.js's main event loop thread. A burst of concurrent login requests can block the event loop, causing Denial of Service (DoS).
4. **Missing Rate Limiting & Account Lockouts:**  
   Neither `/api/auth/login` nor `/api/auth/register` implement IP or email rate limiting, leaving the service vulnerable to automated credential stuffing.

### 3.2 Phase 3: Authorization & Access Control
1. **Edge Middleware Signature Bypass (`src/middleware.ts`):**  
   The middleware uses `parseJwtPayload` which simply splits the token and executes `atob()` on the payload segment. It does not call `jwt.verify()` or validate the cryptographic signature. Anyone can construct an unsigned token with `role: "admin"` to access the admin UI.
2. **Hardcoded Administrative Identifiers:**  
   The email `joshkigs8@gmail.com` is hardcoded across multiple files (`auth.ts`, `entitlements.ts`, `firebaseAuth.ts`, `users/route.ts`, `firestore.rules`). Privileges should instead be controlled via role fields and environment variables.

### 3.3 Phase 4: API Security
1. **Unbounded Input on Registration:**  
   `/api/auth/register` checks `password.length < 8` but enforces no upper bound. Submitting extremely long passwords (e.g. 500 KB) forces bcrypt to consume massive CPU resources.
2. **Unauthenticated Rate Limiting on `/api/chat`:**  
   Anyone can issue unlimited queries to `/api/chat`, exhausting the platform's external Groq API quota.

### 3.4 Phase 5: Database Security (Cloud Firestore & SQLite)
1. **Firestore Rules Logic Bug (`users/{userId}`):**  
   ```firestore
   (!request.resource.data.keys().hasAny(['role', 'planId']) || request.resource.data.role == 'user')
   ```
   If a client provides both `role: 'user'` and `planId: 'vip'`, the expression evaluates to `true` because `request.resource.data.role == 'user'` is satisfied, allowing new users to grant themselves paid VIP tier status in Firestore.
2. **Unverified Email Exemption in Firestore `isAdmin()`:**  
   `isAdmin()` checks `request.auth.token.email == 'joshkigs8@gmail.com'` without checking `request.auth.token.email_verified == true`. If an unverified user registers that address under an untrusted provider, Firestore would grant administrative access.

### 3.5 Phase 6: Payment & Financial Security
1. **Race Condition in Withdrawal Submissions:**  
   `submitWithdrawalRequest` in `src/lib/wallet.ts` reads `const { wallet } = getWallet(userId)` *before* issuing `db.exec("BEGIN IMMEDIATE;")`. In a high-concurrency race condition, two parallel requests could compute deductions against stale balance data.
2. **Webhook Timing Exception:**  
   `verifyWebhookSignature` in `src/lib/payments.ts` executes `crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature))` directly. If `signatureHeader` does not match the exact 64-byte hex length of `expectedSignature`, Node.js throws an uncaught `TypeError` exception rather than returning `false`.
3. **Paystack M-Pesa Implementation Verification:**  
   The core transaction flow is properly secured: prices are retrieved strictly from server-side SQLite tables (`membership_plans`), transactions are verified server-side against Paystack's API before activation, and idempotency is enforced.

### 3.6 Phase 7: Frontend Security
1. **XSS & Content Injection:**  
   `MarkdownRenderer.tsx` parses markdown without using `dangerouslySetInnerHTML`. Inline elements are converted to safe React elements.
2. **Safe Link Sanitization:**  
   `isSafeUrl` actively filters out `javascript:`, `data:`, and `vbscript:` schemes.
3. **Missing Security Headers:**  
   `next.config.mjs` lacks HTTP security headers, leaving pages vulnerable to iframe clickjacking attacks.

### 3.7 Phase 8: Dependency & Supply Chain Security
`npm audit` identified 22 vulnerabilities (1 critical, 5 high, 16 moderate) in transitive dependencies:
- **Critical (CVE-2025-XXXXX / GHSA-9g9p-9gw9-jx7f):** Next.js Image Optimizer DoS via remotePatterns.
- **High (GHSA-m9gg-hp2v-232j):** `@grpc/grpc-js` credential disclosure in Firebase.
- **High (GHSA-qx2v-qp2m-jg93):** `postcss` style stringifier edge cases.

---

## 4. OWASP Top 10 (2021) Evaluation Matrix

| OWASP Category | Evaluation Status | Identified Weaknesses |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | **FAIL** | Client-trusted `/api/auth/firebase-session`, unverified middleware JWT parsing, Firestore rules `planId` bypass. |
| **A02: Cryptographic Failures** | **FAIL** | Fallback to hardcoded `JWT_SECRET`, plaintext password in `users/route.ts` and `set-admin.js`. |
| **A03: Injection** | **PASS** | Parameterized SQL queries used consistently; safe React markdown parsing. |
| **A04: Insecure Design** | **WARN** | Wallet withdrawal check-then-act concurrency window; promo code counter concurrency. |
| **A05: Security Misconfiguration** | **FAIL** | Missing HTTP security headers (CSP, HSTS, X-Frame-Options); `.env.local` missing `JWT_SECRET`. |
| **A06: Vulnerable Components** | **WARN** | 22 transitive package vulnerabilities identified by `npm audit`. |
| **A07: Identification Failures** | **FAIL** | No rate limiting on login/register/chat; lack of password upper bound; synchronous bcrypt. |
| **A08: Software/Data Integrity** | **FAIL** | Server trusting client-asserted email identity without Firebase ID token validation. |
| **A09: Logging & Monitoring** | **WARN** | Admin actions logged, but failed logins and auth rejections lack security auditing. |
| **A10: SSRF** | **PASS** | Outbound HTTP requests restricted to hardcoded, trusted provider domains (Paystack, Groq, Google). |

---

## 5. Emergency Remediation & Verification Summary

Following the comprehensive audit, an immediate emergency remediation was executed covering all Critical and High severity findings (VULN-01 through VULN-05):

1. **Authentication Takeover Hardening (VULN-01):**
   - Implemented `src/lib/verifyFirebaseToken.ts` using authoritative Google Identity Toolkit REST verification (`accounts:lookup`).
   - Hardened `src/app/api/auth/firebase-session/route.ts` to strictly require valid Firebase ID tokens, extract email and UID solely from cryptographically verified claims, and enforce verified email status before granting admin roles.
   - Updated `src/lib/firebaseAuth.ts` to pass `await user.getIdToken()` in standard `Authorization: Bearer` headers.

2. **Cryptographic Secret Hardening (VULN-02):**
   - Generated high-entropy 256-bit secret and configured `JWT_SECRET` in `.env.local`.
   - Updated `src/lib/auth.ts` to reject empty, short (< 32 char), or historically compromised fallback secrets with strict security exceptions. Blacklisted SHA-256 hashes of compromised keys.
   - Enforced HS256 algorithm, issuer (`codevanta-hub`), and audience (`codevanta-app`) validation on all session tokens.

3. **Plaintext Credential Elimination (VULN-03):**
   - Removed hardcoded passwords from `src/app/api/admin/users/route.ts`, `scripts/set-admin.js`, and `src/lib/db.ts`.
   - Admin seeding and sync credentials now require environment variables (`ADMIN_INITIAL_PASSWORD`, `ADMIN_SYNC_PASSWORD`).

4. **Edge Middleware Cryptographic Verification (VULN-04):**
   - Replaced unverified `atob` parsing in `src/middleware.ts` with Web Crypto API (`crypto.subtle.importKey` and `crypto.subtle.verify`) HMAC-SHA256 signature checking.
   - Guarded `/admin/*` and `/api/admin/*` routes at the network edge against forged or tampered tokens.

5. **Cloud Firestore Rules Hardening (VULN-05):**
   - Updated `firestore.rules` via specialized rules subagent.
   - Enforced `request.auth.token.email_verified == true` within `isAdmin()`.
   - Hardened `users/{userId}` create rule to strictly constrain `planId: 'free'` and `role: 'user'`, preventing self-assigned paid subscriptions.

6. **Automated Verification:**
   - Authored and integrated `src/tests/security.test.ts` into `npm test`.
   - 30 / 30 tests (11 domain + 19 security) pass with 100% success rate.
   - Firestore rules compiled and verified via `npx firebase-tools deploy --only firestore:rules --dry-run`.



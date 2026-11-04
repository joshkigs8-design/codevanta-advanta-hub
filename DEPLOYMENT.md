# CodeVanta Advanta Hub — Production Deployment Guide

This guide covers deploying **CodeVanta Advanta Hub** to **Vercel** and **Firebase** with **Firebase Auth & Cloud Firestore** as the identity and document store, alongside a hardened serverless SQLite cache layer.

---

## 1. System Architecture Overview

CodeVanta Advanta Hub utilizes a hybrid cloud architecture:
- **Client & Hosting**: Next.js 14 App Router hosted on **Vercel** (or any Node.js container / serverless platform).
- **Authentication & Core Data Store**: **Firebase Authentication** and **Cloud Firestore** for user identities, catalog directories, tutorials, paths, learning resources, and promo definitions.
- **Transactional & Payment Cache Engine**: High-performance SQLite engine with immediate row-level transaction safety for real-time wallet balances, concurrent referral attributions, M-Pesa / Paystack webhooks, and promo slot quotas.
- **Security & Authorization**: Cryptographically verified Firebase ID tokens and HS256 JWT session cookies (`cv_hub_session`), backed by edge signature verification and strict Firestore Security Rules.

---

## 2. Firebase Configuration & Rules Deployment

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/) named `codevanta-hub`.
2. Enable **Authentication** (Email/Password, Google Provider).
3. Enable **Cloud Firestore** in production mode.
4. Deploy the production-hardened Firestore Security Rules:
   ```bash
   npm run deploy:rules
   ```
   *(Ensures regular users can never self-upgrade roles, plans, or tamper with financial/membership metadata).*

---

## 3. Environment Variables Configuration

Configure the following environment variables in your Vercel project settings or production environment:

| Variable | Description | Example / Note |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical domain of the application | `https://www.codevanta.online` |
| `NEXT_PUBLIC_APP_NAME` | Product display name | `CodeVanta Advanta Hub` |
| `NEXT_PUBLIC_OPERATOR` | Operating business entity | `CodeVanta Ventures` |
| `JWT_SECRET` | Strong 32+ character random secret | `openssl rand -base64 32` |
| `SESSION_COOKIE_NAME` | Name of session cookie | `cv_hub_session` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | Obtained from Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `codevanta-hub.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `codevanta-hub` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket | `codevanta-hub.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID | Numeric project sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:xxx:web:xxx` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | `G-XXXXXXXXXX` |
| `REFERRAL_PROGRAM_STATUS` | Payout gate status (`compliance_review`, `approved_for_launch`, `disabled`) | `approved_for_launch` or `compliance_review` |
| `MINIMUM_WITHDRAWAL_KES` | Minimum payout threshold in KES | `50` |
| `DEFAULT_PAYOUT_FEE_KES` | Transaction fee deducted per payout | `0` |
| `PAYMENT_GATEWAY_MODE` | Payment mode (`sandbox` or `production`) | `production` |
| `PAYSTACK_PUBLIC_KEY` | Paystack Public Key | `pk_live_...` or `pk_test_...` |
| `PAYSTACK_SECRET_KEY` | Paystack Secret Key | `sk_live_...` or `sk_test_...` |
| `MPESA_CALLBACK_SECRET` | HMAC secret for verifying webhook headers | Strong 32+ character key |
| `ADMIN_DEFAULT_EMAIL` | Initial root administrator email | `joshkigs8@gmail.com` |

---

## 4. Deploying to Vercel

### Option A: Via GitHub Integration
1. Push your repository to GitHub (`master` or `main` branch).
2. In Vercel, click **Add New Project** and import `codevanta-advanta-hub`.
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.
5. Enter the Environment Variables listed in Section 3.
6. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 5. Post-Deployment Verification Checklist

- [ ] Open homepage and verify SSL certificate, brand logo, and responsive navigation.
- [ ] Test searching and filtering in the Developer Resource Directory (`/directory`).
- [ ] Test user registration and referral attribution via referral link parameter (`/register?ref=CODE`).
- [ ] Test login using Firebase Auth and verify session cookie issuance.
- [ ] Navigate to `/admin` and confirm that all administrative telemetry renders.
- [ ] Confirm that withdrawal attempts while `REFERRAL_PROGRAM_STATUS=compliance_review` are blocked with the legal compliance notice.
- [ ] Test Paystack webhook verification with signature header.
- [ ] Verify promo code redemption with concurrency guard.

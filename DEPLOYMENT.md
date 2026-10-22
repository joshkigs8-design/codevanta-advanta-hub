# CodeVanta Advanta Hub — Production Deployment Guide

This guide covers deploying **CodeVanta Advanta Hub** to **Vercel** with a **Supabase PostgreSQL** cloud backend.

---

## 1. Supabase PostgreSQL Setup

1. Create an account at [Supabase](https://supabase.com) and create a new project.
2. Under **Project Settings &rarr; Database**, retrieve your connection URI:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
3. Open the **SQL Editor** in the Supabase dashboard.
4. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and execute the query.
   - This sets up all 19 relational tables, indexes, check constraints, and Row Level Security (RLS) policies.
5. In **Project Settings &rarr; API**, copy:
   - `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public key` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role secret key` (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 2. Environment Variables Configuration

Set the following variables in your Vercel project settings (or production `.env`):

| Variable | Description | Example / Note |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical domain of the application | `https://hub.codevanta.com` |
| `NEXT_PUBLIC_APP_NAME` | Product display name | `CodeVanta Advanta Hub` |
| `NEXT_PUBLIC_OPERATOR` | Operating business entity | `CodeVanta Ventures` |
| `JWT_SECRET` | Strong 32+ character random secret | `openssl rand -base64 32` |
| `SESSION_COOKIE_NAME` | Name of session cookie | `cv_hub_session` |
| `REFERRAL_PROGRAM_STATUS` | Payout gate status (`compliance_review`, `approved_for_launch`, `disabled`) | `compliance_review` (Default) |
| `MINIMUM_WITHDRAWAL_KES` | Minimum payout threshold in KES | `100` |
| `DEFAULT_PAYOUT_FEE_KES` | Transaction fee deducted per payout | `0` |
| `PAYMENT_GATEWAY_MODE` | Payment mode (`sandbox` or `production`) | `production` |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja App Consumer Key | Obtained from Safaricom portal |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja App Consumer Secret | Obtained from Safaricom portal |
| `MPESA_PASSKEY` | Lipa Na M-Pesa Online Passkey | Production passkey from Safaricom |
| `MPESA_SHORTCODE` | Business Paybill or Till Number | `174379` |
| `MPESA_CALLBACK_SECRET` | HMAC secret for verifying webhook headers | Strong 32+ character key |
| `ADMIN_DEFAULT_EMAIL` | Initial root administrator email | `admin@codevanta.com` |
| `ADMIN_DEFAULT_PASSWORD` | Strong administrative initial password | `AdminSecurePass2026!` |

---

## 3. Deploying to Vercel

### Option A: Via GitHub Integration
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and import `codevanta-advanta-hub`.
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.
5. Enter the Environment Variables listed in Section 2.
6. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 4. Post-Deployment Verification Checklist

- [ ] Open homepage and verify CSS styling, brand logo, and responsive navigation.
- [ ] Test searching and filtering in the Developer Resource Directory (`/directory`).
- [ ] Test user registration with a referral link parameter (`/register?ref=VANTA26`).
- [ ] Test login using the administrator credentials.
- [ ] Navigate to `/admin` and confirm that all administrative telemetry renders.
- [ ] Confirm that withdrawal attempts while `REFERRAL_PROGRAM_STATUS=compliance_review` are blocked with the legal notice.
- [ ] Trigger a test payment webhook and verify that user role upgrades and ledger entries are recorded.

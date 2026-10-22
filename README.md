# CodeVanta Advanta Hub

> **A production-minded developer discovery and membership SaaS platform operated by CodeVanta Ventures.**

CodeVanta Advanta Hub helps beginner, intermediate, and advanced developers discover verified free and low-cost developer tools, APIs, AI platforms, cloud hosting tiers, student benefits, and production blueprints — with special attention to accessible, affordable access for Kenyan and global engineers.

---

## 🌟 Key Platform Features

### 1. Developer Resource Directory
- **Independently Audited Quotas**: Distinguishes Free & Open Source, Free Hosted Services, Freemium, Limited Trials, and Paid services.
- **Accurate Metadata**: API key requirements, account requirements, credit-card mandates, rate limits, alternatives, and verification logs.
- **Fast Search & Multi-Category Filtering**: Instant client + server filtering across categories, pricing tiers, and skill levels.
- **Personal Bookmarking**: Save and manage resources within plan quota limits.

### 2. Configurable 3-Tier Memberships
- **Basic Tier (KES 150)**: Core directory, basic search, category filtering, beginner roadmaps, personal referral link, up to 10 bookmarks.
- **Pro Tier (KES 250)**: Advanced search & filtering, curated developer collections, learning paths, original project blueprints, up to 50 bookmarks.
- **VIP Tier (KES 350)**: Everything in Pro plus full access to premium guides, downloadable production-ready starter kits, early releases, and up to 250 bookmarks.
- **Zero-Recruitment Guarantee**: All benefits deliver standalone utility immediately. Members are never required or coerced to recruit others.

### 3. Ethical, Non-Pyramid Referral Subsystem
- **Direct Referrals Only**: Strict single-level attribution (`/register?ref=CODE`). No multi-level marketing (MLM), no downlines, and no matrix commissions.
- **Rewarding Policy**: Commissions are earned **only** upon qualifying purchase of an eligible plan:
  - Basic Plan (KES 150) &rarr; KES 50 referral reward
  - Pro Plan (KES 250) &rarr; KES 100 referral reward
  - VIP Plan (KES 350) &rarr; KES 150 referral reward
- **Anti-Fraud Controls**: Database-enforced self-referral blocks, duplicate attribution prevention, and cryptographic webhook idempotency.
- **Legal Compliance Gate**: Default state is `compliance_review`. Real-money commission withdrawals remain hard-locked until an authorized administrator records formal Kenyan advocate certification.

### 4. Append-Only Wallet & Withdrawal Ledger
- Separates **Approved Withdrawable Balance** from **Pending Review Balance**.
- Minimum withdrawal rule (KES 100).
- Strict ledger auditability: Every balance change maps directly to an immutable ledger entry.
- Rejection workflow refunds balances with mandatory audit justification notes.

### 5. Protected Administrative Control Center (`/admin`)
- Real-time telemetry: Registered users, active memberships, revenue (KES), resource health, referral liabilities, and pending withdrawals.
- Editorial verification workflow: Audit resources, mark stale, update verified rate limits.
- Referral management: Review commissions, approve or reject fraud alerts.
- Withdrawal disbursement: Process manual or M-Pesa B2C payouts with external transaction IDs.
- Legal compliance gate switch with advocate roll number logging.
- System audit log timeline for all privileged operations.

---

## 🛠️ Technology Stack

- **Frontend & Runtimes**: Next.js 14 (App Router, Server Components, Server Actions & Route Handlers), React 18, TypeScript (Strict).
- **Styling**: Tailwind CSS (Dark charcoal `#0a0e0c`, deep emerald `#0f231a`, warm gold `#d4af37`, subtle borders).
- **Icons**: Lucide React.
- **Database Engine**:
  - **Local / Standalone**: Built-in zero-dependency `node:sqlite` (Node.js 22/24 native) with automated table initialization, WAL mode, and rich seed data.
  - **Cloud Production**: Supabase PostgreSQL with comprehensive Row Level Security (RLS) policies, foreign keys, triggers, and indices (`supabase/schema.sql`).
- **Auth & Security**: Bcryptjs password hashing, JWT session cookies (HTTP-only, Secure, SameSite=Lax), server-side role validation (`user`, `member`, `admin`).
- **Payments**: M-Pesa Daraja 2.0 sandbox simulator & verified server-side cryptographic webhooks.
- **PWA**: Installable web app manifest (`manifest.webmanifest`), responsive mobile navigation, and theme configurations.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 20+ or 22+ (tested on Node.js v24.19.0)
- npm 10+

### Installation
```bash
# 1. Clone repository
git clone https://github.com/codevanta/codevanta-advanta-hub.git
cd codevanta-advanta-hub

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Accounts

The local database auto-seeds upon initial launch:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@codevanta.com` | `AdminSecurePass2026!` | Full Admin Panel (`/admin`), verification tools, dispute & withdrawal console |
| **Pro Member** | `dev@codevanta.com` | `MemberPass2026!` | Active Pro Membership, Blueprints, Bookmarks, Referral Hub (`/dashboard`) |

---

## 🧪 Running Automated Tests

A comprehensive suite tests the database seed, entitlements engine, anti-fraud rules, webhook idempotency, and legal compliance gate:

```bash
npm test
```

### Production Build Verification
```bash
npm run build
```

---

## 📁 Repository Structure

```
├── public/                     # Static assets & PWA manifest
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── (public)/           # Public home, directory, guides, plans
│   │   ├── admin/              # Protected administrative dashboard
│   │   ├── api/                # 18 REST endpoints (auth, resources, checkout, wallet, admin)
│   │   ├── dashboard/          # Member dashboard, bookmarks, referrals, wallet
│   │   ├── login/ & register/  # Authentication views with ?ref=CODE attribution
│   │   ├── compliance/         # Anti-pyramid disclosure & legal architecture
│   │   ├── terms/ & privacy/   # KDPA 2019 compliant terms & privacy policy
│   │   └── refund-policy/      # Refund policy & commission clawback rules
│   ├── components/             # Reusable UI components (Navbar, Footer, Modals, Cards, Badges)
│   ├── lib/                    # Domain logic & services
│   │   ├── db.ts               # Database abstraction & initial seed data
│   │   ├── auth.ts             # Session issuance, JWT verification, role checks
│   │   ├── referral.ts         # Attribution engine, reward ledger, fraud checks
│   │   ├── wallet.ts           # Append-only ledger, withdrawal requests & reconciliation
│   │   ├── payments.ts         # M-Pesa STK push simulation & idempotent webhooks
│   │   ├── entitlements.ts     # Server-side entitlement validation
│   │   └── audit.ts            # Privileged operation audit logging
│   ├── tests/                  # Automated integration & unit tests
│   └── types/                  # Core TypeScript types & data contracts
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL production schema with RLS
├── DEPLOYMENT.md               # Vercel & Supabase deployment guide
├── PAYMENTS_GUIDE.md           # M-Pesa Daraja 2.0 setup & webhook documentation
└── COMPLIANCE_CHECKLIST.md     # Kenyan Consumer Protection & KDPA 2019 checklist
```

---

## 📜 License & Ownership

&copy; 2026 CodeVanta Ventures. All rights reserved.
Operated from Nairobi, Kenya for developers worldwide.

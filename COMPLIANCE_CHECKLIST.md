# CodeVanta Advanta Hub — Legal & Regulatory Compliance Checklist

> **Operated by CodeVanta Ventures (Nairobi, Kenya)**

This checklist details the regulatory compliance architecture implemented across CodeVanta Advanta Hub to satisfy Kenyan legal standards and consumer protection requirements.

---

## 1. Kenyan Consumer Protection Act (2012) — Anti-Pyramid Review

Under **Section 41** of the Consumer Protection Act, a scheme is considered an unlawful pyramid scheme if participants pay consideration primarily for the opportunity to receive compensation for recruiting other participants, rather than from bona fide commercial sales.

| Statutory Requirement | CodeVanta Hub Implementation | Status |
|---|---|---|
| **Substantive Product Value** | All memberships grant immediate access to verified developer databases, original roadmaps, blueprints, and downloadable starter kits. | ✅ Enforced |
| **No Recruitment Mandate** | Purchasing a membership requires ZERO referrals. Members can utilize 100% of their purchased assets without inviting anyone. | ✅ Enforced |
| **No Multi-Level Downlines** | Referral commissions are strictly single-level (direct referrals only). No downlines, binary trees, or matrix tiers exist. | ✅ Enforced |
| **Direct Product Margin Funding** | Referral rewards (KES 50 for Basic, KES 100 for Pro, KES 150 for VIP) are funded strictly from the gross margin of the sold plan, not from a pool of new entrants. | ✅ Enforced |
| **No Guaranteed Earnings Claims** | Marketing copy explicitly disclaims income guarantees. Rewards are described purely as optional promotional commissions. | ✅ Enforced |

---

## 2. The Legal Compliance Gate Workflow

The application prevents premature real-money payouts through a database-enforced compliance gate:

1. **System Default State**: `REFERRAL_PROGRAM_STATUS=compliance_review`.
2. **Hard-Locked Disbursements**: Any user attempting to submit a withdrawal while in `compliance_review` receives an immediate validation error explaining that legal certification is pending under Kenyan law.
3. **Formal Advocate Sign-Off**:
   - An authorized Kenyan advocate reviews platform terms, commission sustainability, and withholding tax obligations.
   - The advocate's name and High Court roll number must be submitted through the admin console (`/admin`).
4. **Transition to Launch**: Only after recording certification can an administrator transition the status to `approved_for_launch`.

---

## 3. Kenya Data Protection Act, 2019 (KDPA) Checklist

| Requirement | Implementation | Status |
|---|---|---|
| **Lawful Basis of Processing** | Processing is based on user contract execution (membership delivery) and legitimate interest (anti-fraud protection). | ✅ Enforced |
| **Data Minimization** | Only necessary profile and transaction identifiers are collected. Passwords use bcrypt hashing; payment PINs are never requested or stored. | ✅ Enforced |
| **Pseudonymization & Hashing** | Referral attribution technical fingerprints (IP and User-Agent) are hashed using SHA-256 before persistence. | ✅ Enforced |
| **Right to Erasure & Rectification** | Profile management endpoints allow users to view and request account termination. | ✅ Enforced |
| **Audit Trails** | All privileged administrative operations (resource verification, reward disputes, status changes) are logged with admin ID and timestamps. | ✅ Enforced |

---

## 4. Financial Audit & Anti-Fraud Ledger Integrity

- [x] **No Self-Referrals**: Database constraints prevent a user ID from attributing themselves as their own referrer.
- [x] **Duplicate Attribution Block**: A referred user ID is unique in `referral_attributions`.
- [x] **Idempotent Rewards**: Each payment transaction can generate at most one referral reward.
- [x] **Clawback Protocol**: If a qualifying transaction is refunded, the associated reward balance is automatically clawed back in the append-only ledger.
- [x] **Reconciliation Mathematical Integrity**: The user's approved balance matches the algebraic sum of immutable ledger entries.

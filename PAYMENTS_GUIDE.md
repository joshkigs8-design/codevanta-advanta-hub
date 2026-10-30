# CodeVanta Advanta Hub — M-Pesa Daraja 2.0 Payment Integration Guide

This document details the payment processing architecture used in CodeVanta Advanta Hub for accepting Lipa Na M-Pesa Online (STK Push) payments and handling automated server-side webhooks.

---

## 1. Architectural Principles

1. **Never Trust Frontend Redirects**: Frontend payment callbacks or confirmation screens are client-controllable and never treated as proof of purchase.
2. **Server-Side Cryptographic Webhooks**: Memberships and referral rewards are activated **only** when our server receives an authenticated cryptographic webhook from the payment provider.
3. **Idempotency Protection**: Every payment transaction has a unique `idempotency_key` (derived from Safaricom's `CheckoutRequestID` or `MerchantRequestID`). If a network retry delivers a duplicate callback, our server acknowledges the request (`200 OK`) without double-crediting memberships or rewards.
4. **Isolated Transaction Ledger**: Referral commission recording and wallet balance updates run atomically in isolated database transactions.

---

## 2. Payment Flow Diagram

```
Customer                Client Browser          Hub Server              Safaricom Daraja
   │                          │                     │                          │
   │── Select Plan (Pro KES 250)                    │                          │
   │   Enter Phone Number ───>│                     │                          │
   │                          │── POST /api/checkout/initiate                  │
   │                          │                     │── Generate STK Push ────>│
   │                          │                     │   (Store pending record) │
   │                          │<── Payment ID ──────│                          │
   │                                                │                          │
   │<── STK PIN Prompt on Mobile Phone ─────────────┼──────────────────────────│
   │── Enter M-Pesa PIN ────────────────────────────┼─────────────────────────>│
   │                                                │                          │
   │                                                │<── POST /api/checkout/webhook
   │                                                │    (Encrypted HMAC SHA256)
   │                                                │
   │                                                ├── 1. Validate HMAC signature
   │                                                ├── 2. Check idempotency key
   │                                                ├── 3. Upgrade user to 'member'
   │                                                ├── 4. Activate Pro membership
   │                                                └── 5. Trigger referral reward
   │                                                │
   │<── Real-Time Dashboard Refresh ────────────────│
```

---

## 3. Transitioning from Sandbox to Live Daraja Credentials

The application includes an internal sandbox simulator adapter enabled by default (`PAYMENT_GATEWAY_MODE=sandbox`).

To connect to live Safaricom Daraja:
1. Log in to [Safaricom Developer Portal](https://developer.safaricom.co.ke).
2. Create an App under **My Apps** and enable **Lipa Na M-Pesa Online** and **Business to Customer (B2C)**.
3. Obtain your production credentials:
   - **Consumer Key**: `MPESA_CONSUMER_KEY`
   - **Consumer Secret**: `MPESA_CONSUMER_SECRET`
   - **Passkey**: `MPESA_PASSKEY`
   - **Paybill / Till Number**: `MPESA_SHORTCODE`
4. Register your callback URL in Safaricom portal:
   ```
   https://www.codevanta.online/api/checkout/webhook
   ```
5. Set `PAYMENT_GATEWAY_MODE=production` in your environment.

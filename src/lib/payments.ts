import { getDb } from "./db";
import crypto from "node:crypto";
import { processQualifyingReferralReward } from "./referral";
import { Payment, PaymentEvent, PlanSlug, PaymentStatus } from "@/types";

const CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET || "mock_webhook_signature_secret_sandbox";

export function initiateCheckout(
  userId: string,
  planSlug: PlanSlug,
  phoneNumber: string
): { success: boolean; payment?: Payment; error?: string } {
  const db = getDb();

  const plan = db
    .prepare("SELECT * FROM membership_plans WHERE slug = ? AND is_active = 1")
    .get(planSlug) as { id: string; price_kes: number; name: string } | undefined;

  if (!plan) {
    return { success: false, error: "Selected membership plan is inactive or invalid." };
  }

  const paymentId = crypto.randomUUID();
  const idempotencyKey = `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();
  const providerRef = `MPESA-STK-${Date.now()}`;

  const payment: Payment = {
    id: paymentId,
    user_id: userId,
    plan_id: plan.id,
    amount_kes: plan.price_kes,
    currency: "KES",
    provider: "sandbox",
    provider_reference: providerRef,
    checkout_request_id: `ws_CO_${Date.now()}`,
    merchant_request_id: `MR_${Date.now()}`,
    phone_number: phoneNumber,
    status: "pending",
    idempotency_key: idempotencyKey,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO payments (
      id, user_id, plan_id, amount_kes, currency, provider, provider_reference,
      checkout_request_id, merchant_request_id, phone_number, status, idempotency_key, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    payment.id,
    payment.user_id,
    payment.plan_id,
    payment.amount_kes,
    payment.currency,
    payment.provider,
    payment.provider_reference,
    payment.checkout_request_id,
    payment.merchant_request_id,
    payment.phone_number,
    payment.status,
    payment.idempotency_key,
    payment.created_at,
    payment.updated_at
  );

  // Record payment event
  db.prepare(`
    INSERT INTO payment_events (id, payment_id, event_type, provider, event_payload, created_at)
    VALUES (?, ?, 'checkout_initiated', 'sandbox', ?, ?)
  `).run(crypto.randomUUID(), payment.id, JSON.stringify({ planSlug, amount: plan.price_kes, phone: phoneNumber }), now);

  return { success: true, payment };
}

export function verifyWebhookSignature(payloadString: string, signatureHeader?: string | null): boolean {
  if (process.env.NODE_ENV === "development" && (!signatureHeader || signatureHeader === "sandbox_test_signature")) {
    return true;
  }
  if (!signatureHeader) return false;

  const hmac = crypto.createHmac("sha256", CALLBACK_SECRET);
  const expectedSignature = hmac.update(payloadString).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
}

export interface WebhookResult {
  success: boolean;
  message: string;
  paymentId?: string;
}

export function handlePaymentWebhook(
  payload: {
    paymentId: string;
    status: "completed" | "failed";
    mpesaReceiptNumber?: string;
    rawBody?: string;
  }
): WebhookResult {
  const db = getDb();
  const payment = db
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(payload.paymentId) as Payment | undefined;

  if (!payment) {
    return { success: false, message: "Payment transaction not found." };
  }

  // Idempotency: If payment is already completed, return 200 without duplicate action
  if (payment.status === "completed") {
    return { success: true, message: "Payment already processed idempotently.", paymentId: payment.id };
  }

  const nowIso = new Date().toISOString();

  db.exec("BEGIN IMMEDIATE;");
  try {
    if (payload.status === "completed") {
      const receiptNo = payload.mpesaReceiptNumber || `MPESA-${Date.now()}`;

      // 1. Update payment record
      db.prepare(`
        UPDATE payments
        SET status = 'completed', provider_reference = ?, updated_at = ?
        WHERE id = ?
      `).run(receiptNo, nowIso, payment.id);

      // 2. Fetch membership plan details
      const plan = db
        .prepare("SELECT * FROM membership_plans WHERE id = ?")
        .get(payment.plan_id) as { id: string; slug: PlanSlug; name: string } | undefined;

      if (plan) {
        // Upgrade user profile role to 'member' if currently 'user'
        db.prepare("UPDATE profiles SET role = 'member', updated_at = ? WHERE id = ? AND role = 'user'")
          .run(nowIso, payment.user_id);

        // Deactivate previous active memberships for this user
        db.prepare("UPDATE memberships SET status = 'expired', updated_at = ? WHERE user_id = ? AND status = 'active'")
          .run(nowIso, payment.user_id);

        // Create new active membership
        const memId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO memberships (
            id, user_id, plan_id, plan_slug, plan_name, status, amount_paid_kes,
            starts_at, expires_at, payment_reference, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NULL, ?, ?, ?)
        `).run(
          memId,
          payment.user_id,
          plan.id,
          plan.slug,
          plan.name,
          payment.amount_kes,
          nowIso,
          receiptNo,
          nowIso,
          nowIso
        );
      }
    } else {
      // Payment failed
      db.prepare("UPDATE payments SET status = 'failed', updated_at = ? WHERE id = ?")
        .run(nowIso, payment.id);
    }

    // Record webhook event
    db.prepare(`
      INSERT INTO payment_events (id, payment_id, event_type, provider, event_payload, created_at)
      VALUES (?, ?, 'webhook_received', 'mpesa_sandbox', ?, ?)
    `).run(
      crypto.randomUUID(),
      payment.id,
      JSON.stringify(payload),
      nowIso
    );

    db.exec("COMMIT;");

    // Trigger Referral Attribution & Reward Ledger (in its own atomic transaction)
    if (payload.status === "completed") {
      const plan = db
        .prepare("SELECT slug FROM membership_plans WHERE id = ?")
        .get(payment.plan_id) as { slug: PlanSlug } | undefined;
      if (plan) {
        processQualifyingReferralReward(payment.id, payment.user_id, plan.slug);
      }
    }

    return { success: true, message: `Payment marked as ${payload.status}`, paymentId: payment.id };
  } catch (err: unknown) {
    db.exec("ROLLBACK;");
    return { success: false, message: err instanceof Error ? err.message : "Error handling payment webhook" };
  }
}

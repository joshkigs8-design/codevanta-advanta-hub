import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { handlePaymentWebhook } from "@/lib/payments";
import { Payment, PlanSlug } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference")?.trim();

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required." }, { status: 400 });
    }

    const db = getDb();
    let payment = db
      .prepare("SELECT * FROM payments WHERE provider_reference = ? OR id = ?")
      .get(reference, reference) as Payment | undefined;

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Resilient fallback: If transaction is missing in local SQLite (e.g. serverless container cold start),
    // query Paystack API directly and reconstruct the record in local database.
    if (!payment && paystackSecret && !paystackSecret.includes("mock_")) {
      try {
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
          }
        );
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.status && verifyData.data) {
          const meta = verifyData.data.metadata || {};
          const planSlug = meta.planSlug || "vip";
          const matchedPlan = db.prepare("SELECT * FROM membership_plans WHERE slug = ?").get(planSlug) as any;
          if (matchedPlan) {
            const nowIso = new Date().toISOString();
            const recoveredPaymentId = meta.paymentId || `pay_ps_${Date.now()}`;
            db.prepare(`
              INSERT OR IGNORE INTO payments (
                id, user_id, plan_id, amount_kes, currency, provider, provider_reference,
                checkout_request_id, merchant_request_id, phone_number, status, idempotency_key, created_at, updated_at
              ) VALUES (?, ?, ?, ?, 'KES', 'paystack', ?, ?, ?, ?, 'pending', ?, ?, ?)
            `).run(
              recoveredPaymentId,
              meta.userId || user.id,
              matchedPlan.id,
              matchedPlan.price_kes,
              reference,
              `ws_${reference}`,
              `mr_${reference}`,
              verifyData.data.customer?.phone || null,
              `IDEMP-${reference}`,
              nowIso,
              nowIso
            );
            payment = db
              .prepare("SELECT * FROM payments WHERE provider_reference = ? OR id = ?")
              .get(reference, reference) as Payment | undefined;
          }
        }
      } catch (err) {
        console.warn("Could not recover payment from Paystack API:", err);
      }
    }

    if (!payment) {
      return NextResponse.json({ error: "Payment transaction could not be found." }, { status: 404 });
    }

    // Security check: ensure user owns this transaction or is an admin
    if (payment.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied to this transaction." }, { status: 403 });
    }

    const plan = db
      .prepare("SELECT * FROM membership_plans WHERE id = ?")
      .get(payment.plan_id) as { id: string; name: string; slug: PlanSlug; price_kes: number } | undefined;

    // 1. If already marked completed (e.g. by webhook), return immediately
    if (payment.status === "completed") {
      return NextResponse.json({
        status: "success",
        reference: payment.provider_reference,
        amountKes: payment.amount_kes,
        planSlug: plan?.slug,
        planName: plan?.name,
        message: "M-Pesa payment confirmed! Your membership is active.",
      });
    }

    // 2. If marked failed, return failed
    if (payment.status === "failed") {
      return NextResponse.json({
        status: "failed",
        reference: payment.provider_reference,
        message: "Payment was not authorized or was cancelled.",
      });
    }

    // 3. Query Paystack Transaction Verification API
    if (
      paystackSecret &&
      !paystackSecret.includes("mock_") &&
      !paystackSecret.includes("sk_test_placeholder")
    ) {
      try {
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.provider_reference)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
          }
        );

        const verifyData = await verifyRes.json();

        if (verifyRes.ok && verifyData.status) {
          const transactionStatus = verifyData.data?.status;

          if (transactionStatus === "success") {
            // Transaction verified on Paystack! Complete payment and activate membership
            const result = handlePaymentWebhook({
              paymentId: payment.id,
              status: "completed",
              mpesaReceiptNumber: verifyData.data.reference || payment.provider_reference,
              rawBody: JSON.stringify(verifyData.data),
            });

            return NextResponse.json({
              status: "success",
              reference: payment.provider_reference,
              amountKes: payment.amount_kes,
              planSlug: plan?.slug,
              planName: plan?.name,
              message: "M-Pesa payment confirmed! Your membership is now active.",
            });
          }

          if (transactionStatus === "failed" || transactionStatus === "reversed") {
            handlePaymentWebhook({
              paymentId: payment.id,
              status: "failed",
              rawBody: JSON.stringify(verifyData.data),
            });

            return NextResponse.json({
              status: "failed",
              reference: payment.provider_reference,
              message: verifyData.data?.gateway_response || "M-Pesa authorization was declined or cancelled.",
            });
          }

          // Still pending / awaiting M-Pesa PIN entry
          return NextResponse.json({
            status: "pending",
            reference: payment.provider_reference,
            amountKes: payment.amount_kes,
            planSlug: plan?.slug,
            planName: plan?.name,
            displayText:
              verifyData.data?.display_text ||
              `Awaiting M-Pesa PIN authorization on your phone (${payment.phone_number || "mobile device"})...`,
          });
        }
      } catch (verifyErr) {
        console.error("Paystack transaction verification network error:", verifyErr);
      }
    }

    // Sandbox / Local fallback
    return NextResponse.json({
      status: payment.status,
      reference: payment.provider_reference,
      amountKes: payment.amount_kes,
      planSlug: plan?.slug,
      planName: plan?.name,
      displayText: "Awaiting M-Pesa PIN authorization...",
    });
  } catch (err: unknown) {
    console.error("Paystack verification route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error during verification." },
      { status: 500 }
    );
  }
}


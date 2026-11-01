import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initiateCheckout, formatKenyanPhoneNumber } from "@/lib/payments";
import { PlanSlug } from "@/types";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in before checking out." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planSlug, phoneNumber } = body;

    // 1. Validate plan slug
    if (!planSlug || !["starter", "basic", "pro", "vip", "vvip"].includes(planSlug)) {
      return NextResponse.json(
        { error: "Invalid membership tier selected. Must be VVIP, Starter, Basic, Pro, or VIP." },
        { status: 400 }
      );
    }

    // 2. Validate Kenyan M-Pesa phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "M-Pesa phone number is required." },
        { status: 400 }
      );
    }

    const phoneValidation = formatKenyanPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        {
          error: "Please enter a valid Kenyan Safaricom phone number (e.g. 0712 345 678 or 0110 123 456).",
        },
        { status: 400 }
      );
    }

    const formattedPhone = phoneValidation.formatted;
    const e164Phone = phoneValidation.e164;

    // 3. Fetch plan details from SQLite
    const db = getDb();
    const plan = db
      .prepare("SELECT * FROM membership_plans WHERE slug = ? AND is_active = 1")
      .get(planSlug) as { id: string; price_kes: number; name: string; slug: PlanSlug } | undefined;

    if (!plan) {
      return NextResponse.json(
        { error: "Selected membership plan is inactive or could not be found." },
        { status: 404 }
      );
    }

    // 4. Secure backend payment initiation in local database
    const checkoutResult = initiateCheckout(user.id, plan.slug, formattedPhone, "paystack");
    if (!checkoutResult.success || !checkoutResult.payment) {
      return NextResponse.json(
        { error: checkoutResult.error || "Failed to initialize payment transaction." },
        { status: 400 }
      );
    }

    const payment = checkoutResult.payment;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // 5. Call Paystack POST /charge with currency: KES & mobile_money.provider: mpesa
    if (
      paystackSecret &&
      !paystackSecret.includes("mock_") &&
      !paystackSecret.includes("sk_test_placeholder")
    ) {
      try {
        const paystackResponse = await fetch("https://api.paystack.co/charge", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: Math.round(plan.price_kes * 100), // Paystack expects amount in KES cents (kobo equivalent)
            currency: "KES",
            mobile_money: {
              phone: e164Phone,
              provider: "mpesa",
            },
            reference: payment.provider_reference,
            metadata: {
              userId: user.id,
              userEmail: user.email,
              planSlug: plan.slug,
              planName: plan.name,
              paymentId: payment.id,
              phoneNumber: formattedPhone,
              custom_fields: [
                { display_name: "Membership Plan", variable_name: "plan_name", value: plan.name },
                { display_name: "M-Pesa Phone", variable_name: "mpesa_phone", value: formattedPhone },
              ],
            },
          }),
        });

        const pstkData = await paystackResponse.json();

        if (paystackResponse.ok && pstkData.status) {
          // Update DB with Paystack charge response info
          const chargeStatus = pstkData.data?.status || "pending";
          db.prepare(`
            UPDATE payments
            SET raw_payload = ?, updated_at = ?
            WHERE id = ?
          `).run(JSON.stringify(pstkData.data), new Date().toISOString(), payment.id);

          return NextResponse.json({
            success: true,
            mode: "live",
            status: chargeStatus, // "pay_offline" | "pending" | "success"
            reference: payment.provider_reference,
            paymentId: payment.id,
            amountKes: plan.price_kes,
            planSlug: plan.slug,
            planName: plan.name,
            phoneNumber: formattedPhone,
            displayText:
              pstkData.data?.display_text ||
              `An M-Pesa prompt has been dispatched to ${formattedPhone}. Please check your phone and enter your PIN to authorize payment of KES ${plan.price_kes}.`,
          });
        }

        // If Paystack returned a non-200 or status=false
        const errorMessage = pstkData.message || "Failed to trigger M-Pesa authorization prompt.";
        db.prepare(`
          UPDATE payments
          SET status = 'failed', raw_payload = ?, updated_at = ?
          WHERE id = ?
        `).run(JSON.stringify(pstkData), new Date().toISOString(), payment.id);

        return NextResponse.json({ error: errorMessage }, { status: 400 });
      } catch (networkErr: unknown) {
        console.error("Paystack Charge API connection error:", networkErr);
        return NextResponse.json(
          { error: "Could not reach Paystack M-Pesa network. Please check connection and try again." },
          { status: 502 }
        );
      }
    }

    // 6. Sandbox / Developer Fallback Simulation Mode
    return NextResponse.json({
      success: true,
      mode: "sandbox",
      status: "pending",
      reference: payment.provider_reference,
      paymentId: payment.id,
      amountKes: plan.price_kes,
      planSlug: plan.slug,
      planName: plan.name,
      phoneNumber: formattedPhone,
      displayText: `[Sandbox Simulator] M-Pesa authorization prompt simulated to ${formattedPhone} for KES ${plan.price_kes}.`,
    });
  } catch (err: unknown) {
    console.error("Paystack M-Pesa charge initialization route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error during checkout initiation." },
      { status: 500 }
    );
  }
}


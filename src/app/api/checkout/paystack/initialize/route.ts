import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initiateCheckout } from "@/lib/payments";
import { PlanSlug } from "@/types";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to upgrade your membership." }, { status: 401 });
    }

    const body = await req.json();
    const { planSlug, phoneNumber } = body;

    if (!planSlug || !["starter", "basic", "pro", "vip"].includes(planSlug)) {
      return NextResponse.json({ error: "Invalid membership plan selected." }, { status: 400 });
    }

    const db = getDb();
    const plan = db
      .prepare("SELECT * FROM membership_plans WHERE slug = ? AND is_active = 1")
      .get(planSlug) as { id: string; price_kes: number; name: string; slug: PlanSlug } | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Selected plan not found." }, { status: 404 });
    }

    const phone = phoneNumber || user.phone_number || "0700000001";
    const result = initiateCheckout(user.id, planSlug as PlanSlug, phone, "paystack");

    if (!result.success || !result.payment) {
      return NextResponse.json({ error: result.error || "Failed to initiate payment." }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.codevanta.online";

    // If real Paystack Secret Key is configured, initialize live Paystack session
    if (paystackSecret && !paystackSecret.includes("mock_") && !paystackSecret.includes("sk_test_placeholder")) {
      try {
        const pstkRes = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: plan.price_kes * 100, // Paystack expects amount in KES cents (kobo equivalent)
            currency: "KES",
            reference: result.payment.provider_reference,
            callback_url: `${appUrl}/dashboard?payment=success&ref=${result.payment.provider_reference}`,
            metadata: {
              userId: user.id,
              planSlug: plan.slug,
              paymentId: result.payment.id,
              custom_fields: [
                { display_name: "Plan Name", variable_name: "plan_name", value: plan.name },
                { display_name: "Member Phone", variable_name: "member_phone", value: phone },
              ],
            },
          }),
        });

        const pstkData = await pstkRes.json();
        if (pstkRes.ok && pstkData.status) {
          return NextResponse.json({
            success: true,
            mode: "live",
            payment: result.payment,
            authorizationUrl: pstkData.data.authorization_url,
            accessCode: pstkData.data.access_code,
            reference: pstkData.data.reference,
          });
        }
      } catch (pstkErr) {
        console.error("Paystack API call error:", pstkErr);
      }
    }

    // Fallback: Sandbox / Dev simulation mode
    return NextResponse.json({
      success: true,
      mode: "sandbox",
      payment: result.payment,
      reference: result.payment.provider_reference,
      amountKes: plan.price_kes,
      instructions: "Paystack sandbox transaction initialized.",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}


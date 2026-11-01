import { NextRequest, NextResponse } from "next/server";
import { handlePaymentWebhook, verifyPaystackSignature } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const isValid = verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Paystack webhook signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (!data) {
      return NextResponse.json({ error: "Missing payload data" }, { status: 400 });
    }

    if (event === "charge.success") {
      const reference = data.reference;
      const paymentId = data.metadata?.paymentId || reference;

      const result = handlePaymentWebhook({
        paymentId,
        status: "completed",
        mpesaReceiptNumber: reference,
        rawBody,
      });

      return NextResponse.json({
        success: result.success,
        message: result.message,
        paymentId: result.paymentId,
      });
    }

    // Acknowledge other Paystack lifecycle events
    return NextResponse.json({ success: true, message: `Event '${event}' received.` });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}


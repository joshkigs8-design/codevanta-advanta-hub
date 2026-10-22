import { NextRequest, NextResponse } from "next/server";
import { handlePaymentWebhook, verifyWebhookSignature } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-mpesa-signature") || req.headers.get("x-webhook-signature");

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook cryptographic signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { paymentId, status, mpesaReceiptNumber } = payload;

    if (!paymentId || !status) {
      return NextResponse.json({ error: "Missing required webhook parameters" }, { status: 400 });
    }

    const result = handlePaymentWebhook({
      paymentId,
      status: status === "completed" ? "completed" : "failed",
      mpesaReceiptNumber,
      rawBody,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      paymentId: result.paymentId,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

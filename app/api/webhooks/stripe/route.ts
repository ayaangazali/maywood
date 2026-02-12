import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { generateClaimToken, hashToken, tokenLast4 } from "@/lib/token";
import { createAuditEvent } from "@/lib/audit";
import {
  sendEmail,
  buildSenderConfirmationEmail,
  buildRecipientNotificationEmail,
} from "@/lib/email/service";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.gift_order_id;

    if (!orderId) {
      console.error("[WEBHOOK] No gift_order_id in session metadata");
      return NextResponse.json({ received: true });
    }

    try {
      const order = await prisma.giftOrder.findUnique({ where: { id: orderId } });
      if (!order) {
        console.error("[WEBHOOK] Order not found:", orderId);
        return NextResponse.json({ received: true });
      }

      // Skip if already processed
      if (order.status !== "AWAITING_PAYMENT") {
        console.log("[WEBHOOK] Order already processed:", orderId, order.status);
        return NextResponse.json({ received: true });
      }

      // Generate claim token
      const rawToken = generateClaimToken();
      const hashedToken = hashToken(rawToken);
      const last4 = tokenLast4(rawToken);

      // Calculate expiration (default 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Update order
      await prisma.giftOrder.update({
        where: { id: orderId },
        data: {
          status: "ACTIVE",
          stripePaymentIntentId: session.payment_intent as string,
          claimTokenHash: hashedToken,
          claimTokenLast4: last4,
          claimExpiresAt: expiresAt,
        },
      });

      await createAuditEvent(orderId, "PAYMENT_CONFIRMED", "Payment confirmed via Stripe", {
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
      });

      await createAuditEvent(orderId, "CLAIM_LINK_GENERATED", "Claim link generated and activated", {
        tokenLast4: last4,
        expiresAt: expiresAt.toISOString(),
      });

      // Build claim URL
      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      const claimUrl = `${baseUrl}/claim/${rawToken}`;

      // Determine display amount
      const amount =
        order.amountType === "FIXED"
          ? `$${((order.amountFixed ?? 0) / 100).toFixed(0)}`
          : `$${((order.amountMin ?? 0) / 100).toFixed(0)}–$${((order.amountMax ?? 0) / 100).toFixed(0)}`;

      // Send sender email
      const senderEmail = buildSenderConfirmationEmail({
        senderName: order.senderName,
        recipientName: order.recipientName,
        claimUrl,
        amount,
      });
      await sendEmail(orderId, order.senderEmail, senderEmail.subject, senderEmail.html);

      // Optionally send recipient email
      if (order.notifyRecipient) {
        const recipientEmail = buildRecipientNotificationEmail({
          senderName: order.senderName,
          recipientName: order.recipientName,
          claimUrl,
          message: order.message,
          amount,
        });
        await sendEmail(orderId, order.recipientEmail, recipientEmail.subject, recipientEmail.html);
      }

      console.log(`[WEBHOOK] Order ${orderId} activated. Claim URL: ${claimUrl}`);
    } catch (error) {
      console.error("[WEBHOOK] Error processing order:", error);
      // Still return 200 to prevent Stripe retries on our errors
    }
  }

  return NextResponse.json({ received: true });
}

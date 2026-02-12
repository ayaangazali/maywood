import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { validateGiftForm, GiftFormData } from "@/lib/validation";
import { createAuditEvent } from "@/lib/audit";
import { generateClaimToken, hashToken, tokenLast4 } from "@/lib/token";
import {
  sendEmail,
  buildSenderConfirmationEmail,
  buildRecipientNotificationEmail,
} from "@/lib/email/service";

export async function POST(request: NextRequest) {
  try {
    const body: GiftFormData = await request.json();

    // Validate
    const errors = validateGiftForm(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Calculate charge amount in cents
    let chargeCents: number;
    if (body.amountType === "FIXED") {
      chargeCents = Math.round(body.amountFixed! * 100);
    } else {
      chargeCents = Math.round(body.amountMax! * 100);
    }

    // If Stripe is configured, use real checkout flow
    if (stripe) {
      const order = await prisma.giftOrder.create({
        data: {
          senderName: body.senderName.trim(),
          senderEmail: body.senderEmail.trim().toLowerCase(),
          recipientName: body.recipientName.trim(),
          recipientEmail: body.recipientEmail.trim().toLowerCase(),
          recipientPhone: body.recipientPhone?.trim() || null,
          amountType: body.amountType,
          amountFixed: body.amountType === "FIXED" ? chargeCents : null,
          amountMin: body.amountType === "RANGE" ? Math.round(body.amountMin! * 100) : null,
          amountMax: body.amountType === "RANGE" ? chargeCents : null,
          currency: "usd",
          occasion: body.occasion || null,
          message: body.message.trim(),
          cardTemplateId: body.cardTemplateId,
          notifyRecipient: body.notifyRecipient,
          status: "AWAITING_PAYMENT",
        },
      });

      await createAuditEvent(order.id, "ORDER_CREATED", "Gift order created, awaiting payment", {
        amountType: body.amountType,
        chargeCents,
      });

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      const amountLabel =
        body.amountType === "FIXED"
          ? `$${body.amountFixed} gift`
          : `$${body.amountMin}–$${body.amountMax} gift`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Gift for ${body.recipientName}`,
                description: `${amountLabel} — "${body.message.slice(0, 80)}"`,
              },
              unit_amount: chargeCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/create?canceled=true`,
        metadata: { gift_order_id: order.id },
        customer_email: body.senderEmail.trim().toLowerCase(),
      });

      await prisma.giftOrder.update({
        where: { id: order.id },
        data: { stripeCheckoutSessionId: session.id },
      });

      return NextResponse.json({ checkoutUrl: session.url, orderId: order.id });
    }

    // --- Mock mode: no Stripe, activate immediately ---
    const rawToken = generateClaimToken();
    const hashedToken = hashToken(rawToken);
    const last4 = tokenLast4(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (body.expirationDays || 30));

    const order = await prisma.giftOrder.create({
      data: {
        senderName: body.senderName.trim(),
        senderEmail: body.senderEmail.trim().toLowerCase(),
        recipientName: body.recipientName.trim(),
        recipientEmail: body.recipientEmail.trim().toLowerCase(),
        recipientPhone: body.recipientPhone?.trim() || null,
        amountType: body.amountType,
        amountFixed: body.amountType === "FIXED" ? chargeCents : null,
        amountMin: body.amountType === "RANGE" ? Math.round(body.amountMin! * 100) : null,
        amountMax: body.amountType === "RANGE" ? chargeCents : null,
        currency: "usd",
        occasion: body.occasion || null,
        message: body.message.trim(),
        cardTemplateId: body.cardTemplateId,
        notifyRecipient: body.notifyRecipient,
        status: "ACTIVE",
        claimTokenHash: hashedToken,
        claimTokenLast4: last4,
        claimExpiresAt: expiresAt,
      },
    });

    await createAuditEvent(order.id, "ORDER_CREATED", "Gift order created (mock payment)", {
      amountType: body.amountType,
      chargeCents,
    });
    await createAuditEvent(order.id, "CLAIM_LINK_GENERATED", "Claim link generated (mock mode)", {
      tokenLast4: last4,
      expiresAt: expiresAt.toISOString(),
    });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const claimUrl = `${baseUrl}/claim/${rawToken}`;

    // Send stub emails
    const amount =
      body.amountType === "FIXED"
        ? `$${(chargeCents / 100).toFixed(0)}`
        : `$${((body.amountMin ?? 0)).toFixed(0)}–$${((body.amountMax ?? 0)).toFixed(0)}`;

    const senderEmail = buildSenderConfirmationEmail({
      senderName: body.senderName.trim(),
      recipientName: body.recipientName.trim(),
      claimUrl,
      amount,
    });
    await sendEmail(order.id, body.senderEmail.trim().toLowerCase(), senderEmail.subject, senderEmail.html);

    if (body.notifyRecipient) {
      const recipientEmail = buildRecipientNotificationEmail({
        senderName: body.senderName.trim(),
        recipientName: body.recipientName.trim(),
        claimUrl,
        message: body.message.trim(),
        amount,
      });
      await sendEmail(order.id, body.recipientEmail.trim().toLowerCase(), recipientEmail.subject, recipientEmail.html);
    }

    console.log(`\n🎁 GIFT LINK CREATED (mock mode)\n   Claim URL: ${claimUrl}\n   Order: ${order.id}\n`);

    return NextResponse.json({
      claimUrl,
      orderId: order.id,
      recipientName: body.recipientName.trim(),
      amountType: body.amountType,
      chargeCents,
    });
  } catch (error) {
    console.error("[CREATE GIFT] Error:", error);
    return NextResponse.json(
      { error: "Failed to create gift. Please try again." },
      { status: 500 }
    );
  }
}

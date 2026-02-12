import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createAuditEvent } from "@/lib/audit";
import {
  sendEmail,
  buildRecipientNotificationEmail,
} from "@/lib/email/service";
import { generateClaimToken, hashToken, tokenLast4 } from "@/lib/token";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.giftOrder.findUnique({ where: { id } });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Cannot resend email for order in ${order.status} status` },
      { status: 400 }
    );
  }

  // Generate new claim token (invalidates old one)
  const rawToken = generateClaimToken();
  const hashedToken = hashToken(rawToken);
  const last4 = tokenLast4(rawToken);

  await prisma.giftOrder.update({
    where: { id },
    data: {
      claimTokenHash: hashedToken,
      claimTokenLast4: last4,
    },
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const claimUrl = `${baseUrl}/claim/${rawToken}`;

  const amount =
    order.amountType === "FIXED"
      ? `$${((order.amountFixed ?? 0) / 100).toFixed(0)}`
      : `$${((order.amountMin ?? 0) / 100).toFixed(0)}–$${((order.amountMax ?? 0) / 100).toFixed(0)}`;

  const email = buildRecipientNotificationEmail({
    senderName: order.senderName,
    recipientName: order.recipientName,
    claimUrl,
    message: order.message,
    amount,
  });

  await sendEmail(id, order.recipientEmail, email.subject, email.html);
  await createAuditEvent(id, "EMAIL_RESENT", "Admin resent gift email to recipient", {
    tokenLast4: last4,
  });

  return NextResponse.json({ success: true, message: "Email resent to recipient" });
}

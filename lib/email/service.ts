import { prisma } from "../db";
import { StubEmailProvider } from "./stub-provider";
import { EmailProvider } from "./provider";

function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "stub";
  switch (provider) {
    case "stub":
      return new StubEmailProvider();
    // Future: case "resend": return new ResendProvider();
    default:
      return new StubEmailProvider();
  }
}

export async function sendEmail(
  giftOrderId: string,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  // Record in outbox
  const email = await prisma.emailOutbox.create({
    data: {
      giftOrderId,
      to,
      subject,
      html,
      status: "QUEUED",
    },
  });

  try {
    const provider = getEmailProvider();
    await provider.send({ to, subject, html });

    await prisma.emailOutbox.update({
      where: { id: email.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (error) {
    console.error(`[EMAIL] Failed to send email ${email.id}:`, error);
    await prisma.emailOutbox.update({
      where: { id: email.id },
      data: { status: "FAILED" },
    });
  }
}

export function buildSenderConfirmationEmail(params: {
  senderName: string;
  recipientName: string;
  claimUrl: string;
  amount: string;
}): { subject: string; html: string } {
  return {
    subject: `Your gift link for ${params.recipientName} is ready! 🎁`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Your gift link is ready!</h2>
        <p>Hi ${params.senderName},</p>
        <p>Your <strong>${params.amount}</strong> gift for <strong>${params.recipientName}</strong> has been confirmed.</p>
        <p>Share this link with your recipient:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all;">
          <a href="${params.claimUrl}" style="color: #2563eb; font-weight: bold;">${params.claimUrl}</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link can only be used once. Keep it safe!</p>
      </div>
    `,
  };
}

export function buildRecipientNotificationEmail(params: {
  senderName: string;
  recipientName: string;
  claimUrl: string;
  message: string;
  amount: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.senderName} sent you a gift! 🎁`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>You have a gift! 🎉</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.senderName}</strong> sent you a gift worth up to <strong>${params.amount}</strong>.</p>
        ${params.message ? `<div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic;">"${params.message}"</div>` : ""}
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.claimUrl}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Claim Your Gift
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This gift link can only be used once.</p>
      </div>
    `,
  };
}

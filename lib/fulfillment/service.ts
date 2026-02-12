import { prisma } from "../db";
import { createAuditEvent } from "../audit";
import { GiftProvider, FulfillmentResult, SendGiftParams } from "./provider";
import { MockGiftProvider } from "./mock-provider";

function getProvider(): GiftProvider {
  const providerName = process.env.GIFT_PROVIDER ?? "mock";
  switch (providerName.toLowerCase()) {
    case "mock":
      return new MockGiftProvider();
    // Future: case "tango": return new TangoProvider();
    default:
      return new MockGiftProvider();
  }
}

export async function fulfillGift(orderId: string): Promise<FulfillmentResult> {
  const order = await prisma.giftOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { selectedItem: true },
  });

  if (!order.selectedItem) {
    throw new Error(`Order ${orderId} has no selected item`);
  }

  // Update status to FULFILLING
  await prisma.giftOrder.update({
    where: { id: orderId },
    data: { status: "FULFILLING" },
  });

  await createAuditEvent(orderId, "FULFILLMENT_STARTED", "Fulfillment process started", {
    provider: process.env.GIFT_PROVIDER ?? "mock",
    itemId: order.selectedItem.id,
  });

  const provider = getProvider();

  const params: SendGiftParams = {
    recipientEmail: order.recipientEmail,
    amountCents: order.selectedItem.priceCents,
    providerProductId: order.selectedItem.providerProductId,
    message: order.message,
    cardTemplateId: order.cardTemplateId,
  };

  try {
    const result = await provider.sendGift(params);

    await prisma.giftOrder.update({
      where: { id: orderId },
      data: {
        status: "FULFILLED",
        fulfillmentProvider: "MOCK",
        fulfillmentExternalId: result.externalId,
        fulfillmentPayloadJson: JSON.stringify(result.raw),
      },
    });

    await createAuditEvent(orderId, "FULFILLMENT_SUCCEEDED", "Gift fulfilled successfully", {
      externalId: result.externalId,
      provider: provider.name,
    });

    return result;
  } catch (error) {
    await prisma.giftOrder.update({
      where: { id: orderId },
      data: { status: "FULFILLMENT_FAILED" },
    });

    await createAuditEvent(orderId, "FULFILLMENT_FAILED", `Fulfillment failed: ${error}`, {
      error: String(error),
    });

    throw error;
  }
}

/**
 * Fulfill remainder as generic gift card (mock).
 */
export async function fulfillRemainder(
  orderId: string,
  action: "gift_card" | "donate"
): Promise<void> {
  const order = await prisma.giftOrder.findUniqueOrThrow({
    where: { id: orderId },
  });

  if (!order.remainderCents || order.remainderCents <= 0) {
    throw new Error("No remainder to process");
  }

  if (order.remainderFulfilled) {
    throw new Error("Remainder already processed");
  }

  if (action === "donate") {
    // Mock: just record it
    await prisma.giftOrder.update({
      where: { id: orderId },
      data: { remainderAction: "donate", remainderFulfilled: true },
    });
    await createAuditEvent(orderId, "REMAINDER_PROCESSED", `Remainder $${(order.remainderCents / 100).toFixed(2)} donated to charity (mock)`, {
      action: "donate",
      amountCents: order.remainderCents,
    });
    return;
  }

  // Convert to gift card
  const provider = getProvider();
  const result = await provider.sendGift({
    recipientEmail: order.recipientEmail,
    amountCents: order.remainderCents,
    providerProductId: "generic-visa",
    message: `Remainder from your gift from ${order.senderName}`,
    cardTemplateId: order.cardTemplateId,
  });

  await prisma.giftOrder.update({
    where: { id: orderId },
    data: { remainderAction: "gift_card", remainderFulfilled: true },
  });

  await createAuditEvent(orderId, "REMAINDER_PROCESSED", `Remainder converted to gift card`, {
    action: "gift_card",
    amountCents: order.remainderCents,
    externalId: result.externalId,
  });
}

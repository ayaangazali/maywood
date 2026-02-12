import crypto from "crypto";
import {
  GiftProvider,
  SendGiftParams,
  FulfillmentResult,
} from "./provider";

function generateMockCode(): string {
  const segment = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `MOCK-${segment()}-${segment()}-${segment()}`;
}

export class MockGiftProvider implements GiftProvider {
  name = "MOCK";

  async sendGift(params: SendGiftParams): Promise<FulfillmentResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const code = generateMockCode();
    const externalId = `mock_${crypto.randomUUID()}`;

    console.log(
      `[MOCK FULFILLMENT] Gift card sent to ${params.recipientEmail}:`,
      {
        code,
        amount: `$${(params.amountCents / 100).toFixed(2)}`,
        product: params.providerProductId,
      }
    );

    return {
      externalId,
      deliverable: {
        type: "gift_card",
        code,
        redemptionUrl: `https://mock-gift.example.com/redeem/${code}`,
      },
      raw: {
        provider: "mock",
        externalId,
        code,
        amountCents: params.amountCents,
        recipientEmail: params.recipientEmail,
        providerProductId: params.providerProductId,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

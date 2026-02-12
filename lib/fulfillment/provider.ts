export interface FulfillmentResult {
  externalId: string;
  deliverable: {
    type: "gift_card";
    code: string;
    redemptionUrl?: string;
  };
  raw: Record<string, unknown>;
}

export interface SendGiftParams {
  recipientEmail: string;
  amountCents: number;
  providerProductId: string;
  message: string;
  cardTemplateId: string;
}

export interface GiftProvider {
  name: string;
  sendGift(params: SendGiftParams): Promise<FulfillmentResult>;
}

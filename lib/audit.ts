import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export type AuditEventType =
  | "ORDER_CREATED"
  | "PAYMENT_CONFIRMED"
  | "CLAIM_LINK_GENERATED"
  | "CLAIM_ATTEMPTED"
  | "CLAIM_SUCCEEDED"
  | "CLAIM_EXPIRED"
  | "FULFILLMENT_STARTED"
  | "FULFILLMENT_SUCCEEDED"
  | "FULFILLMENT_FAILED"
  | "FULFILLMENT_RETRIED"
  | "EMAIL_SENT"
  | "EMAIL_RESENT"
  | "REMAINDER_PROCESSED"
  | "ORDER_CANCELED"
  | "ADMIN_ACTION";

export async function createAuditEvent(
  giftOrderId: string,
  type: AuditEventType,
  message: string,
  metadata?: Record<string, unknown>
) {
  return prisma.auditEvent.create({
    data: {
      giftOrderId,
      type,
      message,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

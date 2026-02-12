-- CreateTable
CREATE TABLE "GiftOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "amountType" TEXT NOT NULL,
    "amountFixed" INTEGER,
    "amountMin" INTEGER,
    "amountMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "occasion" TEXT,
    "message" TEXT NOT NULL,
    "cardTemplateId" TEXT NOT NULL,
    "notifyRecipient" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "claimTokenHash" TEXT,
    "claimTokenLast4" TEXT,
    "claimExpiresAt" DATETIME,
    "claimedAt" DATETIME,
    "selectedItemId" TEXT,
    "fulfillmentProvider" TEXT NOT NULL DEFAULT 'MOCK',
    "fulfillmentExternalId" TEXT,
    "fulfillmentPayloadJson" TEXT,
    "remainderCents" INTEGER,
    "remainderAction" TEXT,
    "remainderFulfilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GiftOrder_selectedItemId_fkey" FOREIGN KEY ("selectedItemId") REFERENCES "CatalogItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "providerProductId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_giftOrderId_fkey" FOREIGN KEY ("giftOrderId") REFERENCES "GiftOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftOrderId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailOutbox_giftOrderId_fkey" FOREIGN KEY ("giftOrderId") REFERENCES "GiftOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GiftOrder_claimTokenHash_idx" ON "GiftOrder"("claimTokenHash");

-- CreateIndex
CREATE INDEX "GiftOrder_senderEmail_idx" ON "GiftOrder"("senderEmail");

-- CreateIndex
CREATE INDEX "GiftOrder_recipientEmail_idx" ON "GiftOrder"("recipientEmail");

-- CreateIndex
CREATE INDEX "GiftOrder_status_idx" ON "GiftOrder"("status");

-- CreateIndex
CREATE INDEX "GiftOrder_stripeCheckoutSessionId_idx" ON "GiftOrder"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "CatalogItem_active_priceCents_idx" ON "CatalogItem"("active", "priceCents");

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");

-- CreateIndex
CREATE INDEX "AuditEvent_giftOrderId_idx" ON "AuditEvent"("giftOrderId");

-- CreateIndex
CREATE INDEX "AuditEvent_type_idx" ON "AuditEvent"("type");

-- CreateIndex
CREATE INDEX "EmailOutbox_giftOrderId_idx" ON "EmailOutbox"("giftOrderId");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_idx" ON "EmailOutbox"("status");

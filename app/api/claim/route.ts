import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, verifyToken } from "@/lib/token";
import { createAuditEvent } from "@/lib/audit";
import { fulfillGift } from "@/lib/fulfillment/service";
import { checkRateLimit, CLAIM_RATE_LIMIT } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`claim:${ip}`, CLAIM_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { token, itemId } = await request.json();

    if (!token || !itemId) {
      return NextResponse.json({ error: "Token and item selection are required" }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    // Atomic redemption with transaction and row lock
    const result = await prisma.$transaction(async (tx) => {
      // Find and lock the order
      const order = await tx.giftOrder.findUnique({
        where: { claimTokenHash: tokenHash },
      });

      if (!order) {
        return { error: "Invalid or expired gift link", status: 404 };
      }

      // Verify token
      if (!order.claimTokenHash || !verifyToken(token, order.claimTokenHash)) {
        return { error: "Invalid gift link", status: 404 };
      }

      // Check expiry
      if (order.claimExpiresAt && new Date() > new Date(order.claimExpiresAt)) {
        return { error: "This gift link has expired. Please contact the sender.", status: 410 };
      }

      // Check status
      if (order.status !== "ACTIVE") {
        if (order.status === "LOCKED" || order.status === "REDEEMED" || order.status === "FULFILLED" || order.status === "FULFILLING") {
          return { error: "This gift has already been claimed", status: 409 };
        }
        if (order.status === "EXPIRED") {
          return { error: "This gift link has expired", status: 410 };
        }
        return { error: "This gift is not available for claiming", status: 400 };
      }

      // Verify item exists and is within budget
      const item = await tx.catalogItem.findUnique({ where: { id: itemId } });
      if (!item || !item.active) {
        return { error: "Selected item is not available", status: 400 };
      }

      const maxCents = order.amountType === "FIXED"
        ? (order.amountFixed ?? 0)
        : (order.amountMax ?? 0);

      if (item.priceCents > maxCents) {
        return { error: "Selected item exceeds the gift budget", status: 400 };
      }

      // Calculate remainder
      const remainderCents = maxCents - item.priceCents;

      // Lock the order
      await tx.giftOrder.update({
        where: { id: order.id },
        data: {
          status: "LOCKED",
          selectedItemId: itemId,
          claimedAt: new Date(),
          remainderCents: remainderCents > 0 ? remainderCents : null,
        },
      });

      return {
        success: true,
        orderId: order.id,
        remainderCents: remainderCents > 0 ? remainderCents : 0,
        itemTitle: item.title,
        itemPriceCents: item.priceCents,
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Log the claim
    await createAuditEvent(result.orderId, "CLAIM_SUCCEEDED", "Gift claimed successfully", {
      itemId,
      itemTitle: result.itemTitle,
      remainderCents: result.remainderCents,
    });

    // Trigger fulfillment (async, don't block response)
    fulfillGift(result.orderId).catch((err) => {
      console.error(`[CLAIM] Fulfillment failed for order ${result.orderId}:`, err);
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      remainderCents: result.remainderCents,
      message: "Gift claimed successfully!",
    });
  } catch (error) {
    console.error("[CLAIM] Error:", error);
    return NextResponse.json(
      { error: "Failed to process claim. Please try again." },
      { status: 500 }
    );
  }
}

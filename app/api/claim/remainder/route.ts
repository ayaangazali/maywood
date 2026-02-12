import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfillRemainder } from "@/lib/fulfillment/service";

export async function POST(request: NextRequest) {
  try {
    const { orderId, action } = await request.json();

    if (!orderId || !action || !["gift_card", "donate"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const order = await prisma.giftOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.remainderCents || order.remainderCents <= 0) {
      return NextResponse.json({ error: "No remainder to process" }, { status: 400 });
    }

    if (order.remainderFulfilled) {
      return NextResponse.json({ error: "Remainder already processed" }, { status: 409 });
    }

    await fulfillRemainder(orderId, action);

    return NextResponse.json({
      success: true,
      message: action === "donate"
        ? "Thank you! The remainder has been donated to charity."
        : "A gift card for the remaining amount has been sent to your email.",
    });
  } catch (error) {
    console.error("[REMAINDER] Error:", error);
    return NextResponse.json(
      { error: "Failed to process remainder. Please try again." },
      { status: 500 }
    );
  }
}

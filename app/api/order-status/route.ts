import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const order = await prisma.giftOrder.findFirst({
    where: { stripeCheckoutSessionId: sessionId },
    select: {
      id: true,
      status: true,
      recipientName: true,
      senderName: true,
      amountType: true,
      amountFixed: true,
      amountMin: true,
      amountMax: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

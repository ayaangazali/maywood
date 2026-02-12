import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/session";
import { fulfillGift } from "@/lib/fulfillment/service";
import { createAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/db";

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

  if (order.status !== "FULFILLMENT_FAILED" && order.status !== "LOCKED") {
    return NextResponse.json(
      { error: `Cannot retry fulfillment for order in ${order.status} status` },
      { status: 400 }
    );
  }

  await createAuditEvent(id, "FULFILLMENT_RETRIED", "Admin retried fulfillment");

  try {
    await fulfillGift(id);
    return NextResponse.json({ success: true, message: "Fulfillment retried successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: `Fulfillment failed: ${error}` },
      { status: 500 }
    );
  }
}

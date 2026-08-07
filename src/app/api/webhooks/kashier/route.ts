import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyKashierWebhookSignature } from "@/lib/payments/kashier";
import { sendNotification } from "@/lib/notify";
import { notifyAdmin } from "@/lib/notify-admin";

export async function POST(req: NextRequest) {
  const secretKey = process.env.KASHIER_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Kashier not configured" }, { status: 501 });

  const body = await req.json();
  const data = body?.data?.signature ? body?.data : body;

  const paymentStatus = data?.status || data?.paymentStatus;
  const orderNumber = data?.merchantOrderId || data?.orderId;

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
  }

  const success = paymentStatus === "SUCCESS" || paymentStatus === "PAID" || data?.success === true;

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (success) {
    await db.order.update({
      where: { orderNumber },
      data: { paymentStatus: "PAID" },
    });
    await sendNotification(
      { email: order.email, phone: order.phone },
      `Order ${orderNumber} confirmed — payment received.`
    );
    await notifyAdmin(
      `New order ${orderNumber} — ${Number(order.total).toFixed(0)} ${order.currency} (Kashier card, confirmed).`
    );
  } else {
    await db.order.update({
      where: { orderNumber },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}

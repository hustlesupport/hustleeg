import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notify";
import { notifyAdmin } from "@/lib/notify-admin";

// Paymob HMAC is computed over a fixed, ordered concatenation of
// transaction fields — this list and order is per their published
// integration guide, unverified against a live sandbox (no credentials
// available in this build). Re-check field order against Paymob's current
// docs before relying on this in production.
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function getField(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return value === undefined || value === null ? "" : String(value);
}

function verifyHmac(transaction: Record<string, unknown>, receivedHmac: string, secret: string) {
  const concatenated = HMAC_FIELDS.map((field) => getField(transaction, field)).join("");
  const computed = createHmac("sha512", secret).update(concatenated).digest("hex");
  return computed === receivedHmac;
}

export async function POST(req: NextRequest) {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) return NextResponse.json({ error: "Paymob not configured" }, { status: 501 });

  const hmac = req.nextUrl.searchParams.get("hmac");
  const body = await req.json();
  const transaction = body?.obj as Record<string, unknown> | undefined;

  if (!transaction || !hmac || !verifyHmac(transaction, hmac, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const orderNumber = getField(transaction, "order.merchant_order_id");
  const success = transaction.success === true;
  if (!orderNumber) return NextResponse.json({ error: "Missing order reference" }, { status: 400 });

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
      `New order ${orderNumber} — ${(Number(order.total)).toFixed(0)} ${order.currency} (card, confirmed).`
    );
  } else {
    await db.order.update({
      where: { orderNumber },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}

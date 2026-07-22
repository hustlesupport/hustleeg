"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getCourierProvider } from "@/lib/couriers";
import { sendNotification } from "@/lib/notify";

const statusSchema = z.enum([
  "PENDING",
  "PAID",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export async function updateOrderStatusAction(orderId: string, status: z.infer<typeof statusSchema>) {
  const admin = await requireAdmin();
  const parsed = statusSchema.parse(status);

  let order = await db.order.update({ where: { id: orderId }, data: { status: parsed } });
  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "ORDER_STATUS_UPDATE",
      entity: "Order",
      entityId: orderId,
      meta: { status: parsed },
    },
  });

  if (parsed === "SHIPPED" && !order.trackingNumber) {
    order = await createCourierShipment(order);
  }

  if (parsed === "SHIPPED" || parsed === "DELIVERED") {
    const message =
      parsed === "SHIPPED"
        ? `Order ${order.orderNumber} has shipped${order.trackingNumber ? ` — tracking: ${order.trackingNumber}` : ""}.`
        : `Order ${order.orderNumber} has been delivered.`;
    await sendNotification({ email: order.email, phone: order.phone }, message);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { status: order.status, trackingNumber: order.trackingNumber };
}

async function createCourierShipment(order: NonNullable<Awaited<ReturnType<typeof db.order.findUnique>>>) {
  try {
    const address = order.shippingAddress as {
      fullName: string;
      phone: string;
      governorate: string;
      city: string;
      area: string;
      street: string;
    };
    const courier = getCourierProvider();
    const shipment = await courier.createShipment({
      orderNumber: order.orderNumber,
      customerName: address.fullName,
      customerPhone: address.phone,
      governorate: address.governorate,
      city: address.city,
      area: address.area,
      street: address.street,
      codAmount: order.paymentMethod === "COD" ? Number(order.total) : 0,
    });
    return db.order.update({
      where: { id: order.id },
      data: { courier: courier.name, trackingNumber: shipment.trackingNumber },
    });
  } catch (err) {
    // A failed courier call shouldn't block marking the order shipped —
    // staff can retry or set tracking manually via updateTrackingAction.
    console.error(`[courier] shipment creation failed for ${order.orderNumber}:`, err);
    return order;
  }
}

export async function updateTrackingAction(orderId: string, courier: string, trackingNumber: string) {
  await requireAdmin();
  await db.order.update({ where: { id: orderId }, data: { courier, trackingNumber } });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function addOrderNoteAction(orderId: string, note: string) {
  await requireAdmin();
  await db.order.update({ where: { id: orderId }, data: { internalNotes: note } });
  revalidatePath(`/admin/orders/${orderId}`);
}

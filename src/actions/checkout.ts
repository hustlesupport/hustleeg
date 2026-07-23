"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCart, clearCartCookie } from "@/lib/cart-session";
import { generateOrderNumber } from "@/lib/order-number";
import { calculateShipping } from "@/lib/shipping";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getPaymentGateway } from "@/lib/payments";
import { sendNotification } from "@/lib/notify";
import { notifyAdmin } from "@/lib/notify-admin";
import { formatMoney } from "@/lib/format";
import { getAppliedDiscountAction } from "@/actions/discount";
import { clearAppliedDiscountCode } from "@/lib/discount-session";
import { getAttributionSource } from "@/actions/attribution";

const POINTS_PER_EGP = 1 / 10; // 1 point per 10 EGP spent
const REFERRAL_REWARD_POINTS = 100;

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  governorate: z.enum(EGYPT_GOVERNORATES),
  city: z.string().min(2),
  area: z.string().min(2),
  street: z.string().min(2),
  building: z.string().optional(),
  apartment: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "CARD"]).default("COD"),
});

export type CheckoutInput = z.infer<typeof addressSchema>;

export async function placeOrderAction(input: CheckoutInput) {
  const data = addressSchema.parse(input);

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    throw new Error("Your bag is empty.");
  }

  const customer = await getCurrentCustomer();
  const attributionSource = await getAttributionSource();

  // Computed once, up front, and reused for both the card charge amount
  // and the order record — the discount must be reflected in what's
  // actually charged, not just what's displayed.
  const previewSubtotal = cart.items.reduce((sum, i) => sum + Number(i.priceAtAdd) * i.quantity, 0);
  const appliedDiscount = await getAppliedDiscountAction();
  const previewShipping = appliedDiscount?.freeShipping ? 0 : calculateShipping(data.governorate, previewSubtotal);
  const previewTotal = Math.max(0, previewSubtotal - (appliedDiscount?.amount ?? 0)) + previewShipping;

  // Generated once up front so the order number sent to the payment
  // gateway (and matched back later via webhook) is the exact same one the
  // order gets created with below — never regenerated mid-flow.
  const orderNumber = generateOrderNumber();

  // Charge before touching the database — a slow gateway call shouldn't
  // hold a DB transaction open, and a failed charge should mean no order
  // (and no inventory decrement) exists at all.
  let redirectUrl: string | undefined;
  let paymentStatus: "PENDING" | "PAID" = "PENDING";
  if (data.paymentMethod === "CARD") {
    const gateway = getPaymentGateway();
    const result = await gateway.charge({
      amount: previewTotal,
      currency: "EGP",
      orderNumber,
      customerEmail: data.email,
      customerPhone: data.phone,
      customerName: data.fullName,
    });

    if (result.status === "failed") throw new Error(result.reason);
    if (result.status === "pending") redirectUrl = result.redirectUrl;
    if (result.status === "succeeded") paymentStatus = "PAID";
  }

  const order = await db.$transaction(async (tx) => {
    // Re-read inventory fresh, inside the transaction — `cart.items[].variant.inventory`
    // was loaded by `getCart()` before this transaction started, so under concurrent
    // checkouts (exactly what a limited drop causes) that snapshot can be stale by the
    // time we get here. The check below is advisory (gives a clean "sold out" message
    // before doing any writes); the decrement further down is what actually prevents
    // overselling, by making the write itself conditional on remaining stock.
    const freshInventory = await tx.inventoryItem.findMany({
      where: { variantId: { in: cart.items.map((i) => i.variantId) } },
    });
    for (const item of cart.items) {
      const stock = freshInventory
        .filter((inv) => inv.variantId === item.variantId)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (item.quantity > stock) {
        throw new Error(`${item.variant.product.name} (${item.variant.size}) only has ${stock} left.`);
      }
    }

    const campaignQuantities = new Map<string, { name: string; limit: number; quantity: number }>();
    for (const item of cart.items) {
      const product = await tx.product.findUnique({
        where: { id: item.variant.productId },
        select: { campaign: { select: { id: true, name: true, purchaseLimitPerCustomer: true } } },
      });
      const campaign = product?.campaign;
      if (!campaign?.purchaseLimitPerCustomer) continue;
      const entry = campaignQuantities.get(campaign.id) ?? {
        name: campaign.name,
        limit: campaign.purchaseLimitPerCustomer,
        quantity: 0,
      };
      entry.quantity += item.quantity;
      campaignQuantities.set(campaign.id, entry);
    }
    for (const { name, limit, quantity } of campaignQuantities.values()) {
      if (quantity > limit) {
        throw new Error(`Limit ${limit} per customer for ${name} — your bag has ${quantity}.`);
      }
    }

    const subtotal = cart.items.reduce((sum, i) => sum + Number(i.priceAtAdd) * i.quantity, 0);
    const shippingTotal = appliedDiscount?.freeShipping ? 0 : calculateShipping(data.governorate, subtotal);
    const discountTotal = appliedDiscount?.amount ?? 0;
    const total = Math.max(0, subtotal - discountTotal) + shippingTotal;

    if (appliedDiscount) {
      const updated = await tx.discountCode.updateMany({
        where: { code: appliedDiscount.code, usageLimit: { not: null } },
        data: { usedCount: { increment: 1 } },
      });
      if (updated.count === 0) {
        // No usageLimit set — still track usage, just without the guard.
        await tx.discountCode.update({
          where: { code: appliedDiscount.code },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer?.id,
        email: data.email,
        phone: data.phone,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        status: "PENDING",
        subtotal,
        shippingTotal,
        discountTotal,
        discountCode: appliedDiscount?.code,
        attributionSource,
        total,
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          governorate: data.governorate,
          city: data.city,
          area: data.area,
          street: data.street,
          building: data.building ?? null,
          apartment: data.apartment ?? null,
        },
        internalNotes: data.notes,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantLabel: `${item.variant.size} / ${item.variant.color}`,
            sku: item.variant.sku,
            quantity: item.quantity,
            price: item.priceAtAdd,
            total: Number(item.priceAtAdd) * item.quantity,
          })),
        },
      },
    });

    for (const item of cart.items) {
      let remaining = item.quantity;
      const rows = freshInventory.filter((inv) => inv.variantId === item.variantId);
      for (const inv of rows) {
        if (remaining <= 0) break;
        const take = Math.min(inv.quantity, remaining);
        if (take > 0) {
          // Guarding the WHERE clause on the row's current quantity — rather
          // than trusting the `freshInventory` snapshot above — is what
          // actually makes this safe under concurrency: Postgres resolves
          // this UPDATE atomically per row, so two simultaneous checkouts
          // racing for the last unit can't both succeed.
          const result = await tx.inventoryItem.updateMany({
            where: { id: inv.id, quantity: { gte: take } },
            data: { quantity: { decrement: take } },
          });
          if (result.count === 0) {
            throw new Error(`${item.variant.product.name} (${item.variant.size}) just sold out.`);
          }
          remaining -= take;
        }
      }
      if (remaining > 0) {
        throw new Error(`${item.variant.product.name} (${item.variant.size}) just sold out.`);
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (customer) {
      const earnedPoints = Math.floor(subtotal * POINTS_PER_EGP);
      await tx.customer.update({
        where: { id: customer.id },
        data: { loyaltyPoints: { increment: earnedPoints } },
      });

      // Reward the referrer once, on the referred customer's first order.
      if (customer.referredByCustomerId && !customer.referralRewardGranted) {
        const priorOrders = await tx.order.count({ where: { customerId: customer.id } });
        if (priorOrders === 1) {
          await tx.customer.update({
            where: { id: customer.referredByCustomerId },
            data: { loyaltyPoints: { increment: REFERRAL_REWARD_POINTS } },
          });
          await tx.customer.update({
            where: { id: customer.id },
            data: { referralRewardGranted: true },
          });
        }
      }
    }

    return created;
  });

  await clearCartCookie();
  await clearAppliedDiscountCode();

  // COD and successfully-charged card orders are confirmed now; a pending
  // card order gets its confirmation notification from the webhook once
  // the gateway actually settles it.
  if (!redirectUrl) {
    await sendNotification(
      { email: data.email, phone: data.phone },
      `Order ${order.orderNumber} confirmed — ${data.paymentMethod === "COD" ? "pay on delivery" : "payment received"}.`
    );
  }

  // New-order alert to the store owner, mirroring the "Shopify app ping"
  // merchants expect — fires for every order regardless of payment method.
  await notifyAdmin(
    `New order ${order.orderNumber} — ${formatMoney(Number(order.total), order.currency)} from ${data.fullName}.`
  );

  return { orderNumber: order.orderNumber, redirectUrl };
}

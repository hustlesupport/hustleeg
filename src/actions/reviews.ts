"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { requireCustomer } from "@/lib/customer-auth";
import { invalidate } from "@/lib/cache";

const reviewSchema = z.object({
  productId: z.string(),
  productSlug: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10, "Tell us a bit more.").max(2000),
});

export async function submitReviewAction(input: z.infer<typeof reviewSchema>) {
  const customer = await requireCustomer();
  const data = reviewSchema.parse(input);

  const existing = await db.review.findFirst({
    where: { productId: data.productId, customerId: customer.id },
  });
  if (existing) throw new Error("You've already reviewed this product.");

  await db.review.create({
    data: {
      productId: data.productId,
      customerId: customer.id,
      rating: data.rating,
      title: data.title,
      body: data.body,
    },
  });

  revalidatePath(`/products/${data.productSlug}`);
  return { ok: true };
}

export async function moderateReviewAction(reviewId: string, approved: boolean) {
  await requireAdmin();
  const review = await db.review.update({
    where: { id: reviewId },
    data: { approved },
    include: { product: { select: { slug: true, id: true } } },
  });
  await invalidate(`product:${review.product.slug}`);
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.product.slug}`);
}

export async function deleteReviewAction(reviewId: string) {
  await requireAdmin();
  const review = await db.review.delete({
    where: { id: reviewId },
    include: { product: { select: { slug: true } } },
  });
  await invalidate(`product:${review.product.slug}`);
  revalidatePath("/admin/reviews");
}

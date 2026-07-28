import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DiscountForm } from "@/components/admin/discount-form";
import { getAdminProductsForDiscountSelect } from "@/actions/admin-discounts";

export const metadata = { title: "Edit Promotion" };

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const code = await db.discountCode.findUnique({ where: { id } });
  if (!code) notFound();

  const products = await getAdminProductsForDiscountSelect();

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Edit Promotion</h1>
      <DiscountForm
        products={products}
        initial={{
          id: code.id,
          title: code.title || "",
          code: code.code || "",
          isAutomatic: code.isAutomatic,
          type: code.type as any,
          scope: code.scope as any,
          targetProductLine: code.targetProductLine as any,
          targetProductIds: code.targetProductIds || [],
          value: Number(code.value),
          buyQuantity: code.buyQuantity,
          getQuantity: code.getQuantity,
          getDiscountPercent: code.getDiscountPercent ? Number(code.getDiscountPercent) : 100,
          minSpend: code.minSpend ? Number(code.minSpend) : null,
          usageLimit: code.usageLimit,
          startAt: code.startAt ? code.startAt.toISOString() : null,
          endAt: code.endAt ? code.endAt.toISOString() : null,
          active: code.active,
        }}
      />
    </div>
  );
}

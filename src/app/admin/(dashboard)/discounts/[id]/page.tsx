import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DiscountForm } from "@/components/admin/discount-form";

export const metadata = { title: "Edit discount code" };

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const code = await db.discountCode.findUnique({ where: { id } });
  if (!code) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Edit discount code</h1>
      <DiscountForm
        initial={{
          id: code.id,
          code: code.code,
          type: code.type,
          value: Number(code.value),
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

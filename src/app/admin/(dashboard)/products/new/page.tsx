import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const campaigns = await db.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">New product</h1>
      <ProductForm campaigns={campaigns} />
    </div>
  );
}

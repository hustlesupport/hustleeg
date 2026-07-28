import { DiscountForm } from "@/components/admin/discount-form";
import { getAdminProductsForDiscountSelect } from "@/actions/admin-discounts";

export const metadata = { title: "Create New Promotion" };

export default async function NewDiscountPage() {
  const products = await getAdminProductsForDiscountSelect();

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Create New Promotion / Discount</h1>
      <DiscountForm products={products} />
    </div>
  );
}

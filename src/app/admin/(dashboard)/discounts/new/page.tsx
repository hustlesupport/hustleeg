import { DiscountForm } from "@/components/admin/discount-form";

export const metadata = { title: "New discount code" };

export default function NewDiscountPage() {
  return (
    <div>
      <h1 className="font-display text-2xl mb-8">New discount code</h1>
      <DiscountForm />
    </div>
  );
}

import { CheckoutForm } from "@/components/storefront/checkout-form";
import { AnalyticsTracker } from "@/components/storefront/analytics-tracker";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  const savedAddresses = customer
    ? await db.address.findMany({
        where: { customerId: customer.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <AnalyticsTracker type="CHECKOUT_STARTED" />
      <h1 className="font-display text-3xl mb-10">Checkout</h1>
      <CheckoutForm
        savedAddresses={savedAddresses}
        defaultEmail={customer?.email}
        defaultPhone={customer?.phone ?? undefined}
      />
    </div>
  );
}

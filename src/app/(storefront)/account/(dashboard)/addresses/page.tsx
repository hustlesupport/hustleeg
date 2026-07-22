import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { AddressManager } from "@/components/storefront/address-manager";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const addresses = await db.address.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Addresses</h1>
      <AddressManager initialAddresses={addresses} />
    </div>
  );
}

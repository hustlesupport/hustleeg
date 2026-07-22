import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { AccountNav } from "@/components/storefront/account-nav";

export default async function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-10 md:flex-row">
        <AccountNav />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

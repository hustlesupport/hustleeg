import { getCurrentCustomer } from "@/lib/customer-auth";
import { ProfileForm } from "@/components/storefront/profile-form";
import { customerLogoutAction } from "@/actions/customer-auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Profile</h1>
      <p className="font-mono text-xs text-concrete-grey mb-8">
        {customer.email} · Member {customer.memberNumber}
      </p>
      <ProfileForm
        initial={{
          firstName: customer.firstName ?? "",
          lastName: customer.lastName ?? "",
          phone: customer.phone ?? "",
          preferredSize: customer.preferredSize ?? "",
        }}
      />

      <form action={customerLogoutAction} className="mt-10 border-t border-matte-black/10 pt-6">
        <button className="font-mono text-xs uppercase tracking-widest text-concrete-grey hover:text-matte-black">
          Sign out
        </button>
      </form>
    </div>
  );
}

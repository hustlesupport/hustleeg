"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerAction } from "@/actions/customer-auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await registerAction({
          email: String(formData.get("email")),
          password: String(formData.get("password")),
          firstName: String(formData.get("firstName")),
          lastName: String(formData.get("lastName")),
          phone: String(formData.get("phone") || "") || undefined,
          referralCode,
        });
        router.push("/account");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create account.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-3xl mb-2">Join the community</h1>
      <p className="font-mono text-xs text-concrete-grey mb-10">
        {referralCode ? "You were referred by another member — welcome." : "Create your Hustle account."}
      </p>
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="firstName" required placeholder="First name" className="input" />
          <input name="lastName" required placeholder="Last name" className="input" />
        </div>
        <input name="email" type="email" required placeholder="Email" className="input w-full" />
        <input name="phone" type="tel" placeholder="Phone (optional)" className="input w-full" />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password (min 8 characters)"
          className="input w-full"
        />
        {error && <p className="font-mono text-xs text-red-600">{error}</p>}
        <button
          disabled={isPending}
          className="w-full bg-matte-black py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 font-mono text-xs text-concrete-grey">
        Already a member?{" "}
        <Link href="/account/login" className="text-matte-black underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

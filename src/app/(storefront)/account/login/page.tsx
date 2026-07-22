"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerLoginAction } from "@/actions/customer-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await customerLoginAction({
          email: String(formData.get("email")),
          password: String(formData.get("password")),
        });
        router.push(searchParams.get("from") ?? "/account");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-3xl mb-2">Sign in</h1>
      <p className="font-mono text-xs text-concrete-grey mb-10">
        Order history, wishlist, and your Community Card live here.
      </p>
      <form action={handleSubmit} className="space-y-4">
        <input name="email" type="email" required placeholder="Email" className="input w-full" />
        <input name="password" type="password" required placeholder="Password" className="input w-full" />
        {error && <p className="font-mono text-xs text-red-600">{error}</p>}
        <button
          disabled={isPending}
          className="w-full bg-matte-black py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 font-mono text-xs text-concrete-grey">
        New here?{" "}
        <Link href="/account/register" className="text-matte-black underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

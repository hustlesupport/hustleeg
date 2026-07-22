"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction, verifyLoginTwoFactorAction } from "@/actions/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await loginAction({
          email: String(formData.get("email")),
          password: String(formData.get("password")),
        });
        if (result.requiresTwoFactor) {
          setNeedsTwoFactor(true);
          return;
        }
        router.push("/admin");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed.");
      }
    });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await verifyLoginTwoFactorAction(code);
        router.push("/admin");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid code.");
      }
    });
  }

  if (needsTwoFactor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-matte-black px-6">
        <form onSubmit={handleVerify} className="w-full max-w-sm space-y-5">
          <h1 className="font-display text-2xl text-off-white text-center mb-2">Two-factor code</h1>
          <p className="font-mono text-xs text-off-white/50 text-center mb-6">
            Enter the 6-digit code from your authenticator app.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoFocus
            className="w-full border border-off-white/20 bg-transparent px-4 py-3 text-center font-mono text-lg tracking-[0.5em] text-off-white placeholder:text-off-white/40 focus:border-neon-accent focus:outline-none"
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          <button
            disabled={isPending || code.length !== 6}
            className="w-full bg-neon-accent py-3 font-mono text-sm uppercase tracking-widest text-matte-black disabled:opacity-40"
          >
            {isPending ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-matte-black px-6">
      <form action={handleSubmit} className="w-full max-w-sm space-y-5">
        <h1 className="font-display text-2xl text-off-white text-center mb-6">HUSTLE ADMIN</h1>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full border border-off-white/20 bg-transparent px-4 py-3 font-mono text-sm text-off-white placeholder:text-off-white/40 focus:border-neon-accent focus:outline-none"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full border border-off-white/20 bg-transparent px-4 py-3 font-mono text-sm text-off-white placeholder:text-off-white/40 focus:border-neon-accent focus:outline-none"
        />
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        <button
          disabled={isPending}
          className="w-full bg-neon-accent py-3 font-mono text-sm uppercase tracking-widest text-matte-black disabled:opacity-40"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startTwoFactorSetupAction, confirmTwoFactorSetupAction, disableTwoFactorAction } from "@/actions/admin-auth";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      setSetup(await startTwoFactorSetupAction());
    });
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await confirmTwoFactorSetupAction(code);
        setSetup(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid code.");
      }
    });
  }

  function handleDisable() {
    if (!confirm("Turn off two-factor authentication?")) return;
    startTransition(async () => {
      await disableTwoFactorAction();
      router.refresh();
    });
  }

  if (enabled) {
    return (
      <div className="flex items-center gap-4">
        <p className="font-mono text-xs text-neon-accent">Two-factor authentication is on</p>
        <button onClick={handleDisable} disabled={isPending} className="font-mono text-xs text-red-600 hover:underline">
          Turn off
        </button>
      </div>
    );
  }

  if (setup) {
    return (
      <form onSubmit={handleConfirm} className="space-y-3 max-w-sm">
        <p className="font-mono text-xs text-concrete-grey">
          Add this to Google Authenticator, Authy, or any TOTP app (manual entry — enter the secret below):
        </p>
        <p className="border border-matte-black/20 px-3 py-2 font-mono text-sm break-all">{setup.secret}</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit code from the app"
          className="input w-full"
        />
        {error && <p className="font-mono text-xs text-red-600">{error}</p>}
        <button
          disabled={isPending || code.length !== 6}
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "Confirming…" : "Confirm & enable"}
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={isPending}
      className="border border-matte-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
    >
      {isPending ? "…" : "Set up two-factor authentication"}
    </button>
  );
}

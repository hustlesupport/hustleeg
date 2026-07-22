"use client";

import { useState, useTransition } from "react";
import { sendOtpAction, verifyOtpAction } from "@/actions/otp";

// The parent resets `verified` (and remounts this component via `key={phone}`)
// whenever the phone number itself changes — see checkout-form.tsx. That
// keeps "editing the phone invalidates verification" a plain state update
// in the event handler that caused it, instead of an effect reacting to it.
export function PhoneOtp({
  phone,
  verified,
  onVerified,
}: {
  phone: string;
  verified: boolean;
  onVerified: (verified: boolean) => void;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (phone.trim().length < 8) {
      setError("Enter a phone number first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendOtpAction(phone);
      setSent(true);
      setDevCode(result.devCode ?? null);
    });
  }

  function handleVerify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(phone, code);
      if (result.verified) {
        onVerified(true);
      } else {
        setError(result.reason ?? "Could not verify.");
      }
    });
  }

  if (verified) {
    return <p className="font-mono text-xs text-neon-accent">Phone verified ✓</p>;
  }

  return (
    <div className="space-y-2">
      {!sent ? (
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          className="font-mono text-xs uppercase tracking-widest underline hover:text-neon-accent disabled:opacity-40"
        >
          Send verification code
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            className="input w-32"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={isPending || code.length !== 6}
            className="border border-matte-black px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-matte-black hover:text-off-white disabled:opacity-40"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending}
            className="font-mono text-xs text-concrete-grey underline"
          >
            Resend
          </button>
        </div>
      )}
      {devCode && (
        <p className="font-mono text-xs text-concrete-grey">
          Dev mode (no SMS provider connected) — code: {devCode}
        </p>
      )}
      {error && <p className="font-mono text-xs text-red-600">{error}</p>}
    </div>
  );
}

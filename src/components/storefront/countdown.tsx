"use client";

import { useEffect, useState } from "react";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function getRemaining(target: Date): Remaining {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown({ target }: { target: string | Date }) {
  const targetTime = new Date(target).getTime();
  // Server and the pre-hydration client render must match exactly, so we
  // start with `null` (server has no reliable "now") and only compute the
  // real countdown after mount — the live values arrive one tick later.
  const [time, setTime] = useState<Remaining | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first tick must happen client-only, after hydration
    setTime(getRemaining(new Date(targetTime)));
    const id = setInterval(() => setTime(getRemaining(new Date(targetTime))), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  return (
    <div className="flex gap-4 font-mono text-sm">
      {([
        ["D", time?.days],
        ["H", time?.hours],
        ["M", time?.minutes],
        ["S", time?.seconds],
      ] as const).map(([label, value]) => (
        <span key={label}>
          {value === undefined ? "--" : String(value).padStart(2, "0")}
          {label}
        </span>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";

export function ReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex max-w-lg gap-2">
      <input readOnly value={url} className="input flex-1" />
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="bg-matte-black px-4 py-3 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

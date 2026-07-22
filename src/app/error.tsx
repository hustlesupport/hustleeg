"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-off-white px-6 text-center text-matte-black">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">Error</p>
      <h1 className="font-display text-4xl sm:text-6xl">Something broke</h1>
      <p className="mt-4 max-w-md font-ui text-concrete-grey">
        That&apos;s on us. Try again, and if it keeps happening, come back later.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-concrete-grey/70">Reference: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-8 inline-block bg-matte-black px-8 py-3 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
      >
        Try again
      </button>
    </div>
  );
}

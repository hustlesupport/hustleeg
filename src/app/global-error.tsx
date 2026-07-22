"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-off-white px-6 text-center text-matte-black antialiased">
        <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">
          Critical error
        </p>
        <h1 className="font-display text-4xl sm:text-6xl uppercase">Hustle is down</h1>
        <p className="mt-4 max-w-md">
          Something went wrong loading the site. Try again in a moment.
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
      </body>
    </html>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReviewAction } from "@/actions/reviews";

export function ReviewForm({
  productId,
  productSlug,
  signedIn,
  alreadyReviewed,
}: {
  productId: string;
  productSlug: string;
  signedIn: boolean;
  alreadyReviewed: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <p className="font-mono text-xs text-concrete-grey">
        <Link href={`/account/login?from=/products/${productSlug}`} className="underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  if (alreadyReviewed || done) {
    return <p className="font-mono text-xs text-neon-accent">Thanks — your review is in for approval.</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitReviewAction({ productId, productSlug, rating, title, body });
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit review.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-matte-black/10 p-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`font-mono text-lg ${n <= rating ? "text-neon-accent" : "text-matte-black/20"}`}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        className="input w-full"
      />
      <textarea
        required
        minLength={10}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think?"
        rows={3}
        className="input w-full"
      />
      {error && <p className="font-mono text-xs text-red-600">{error}</p>}
      <button
        disabled={isPending}
        className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
      >
        {isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

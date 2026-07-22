"use client";

import { useTransition } from "react";
import { moderateReviewAction, deleteReviewAction } from "@/actions/reviews";

export function ReviewModerationRow({
  reviewId,
  approved,
}: {
  reviewId: string;
  approved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-3 font-mono text-xs">
      {!approved && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => moderateReviewAction(reviewId, true))}
          className="text-neon-accent hover:underline disabled:opacity-40"
        >
          Approve
        </button>
      )}
      {approved && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => moderateReviewAction(reviewId, false))}
          className="text-concrete-grey hover:underline disabled:opacity-40"
        >
          Unpublish
        </button>
      )}
      <button
        disabled={isPending}
        onClick={() => startTransition(() => deleteReviewAction(reviewId))}
        className="text-red-600 hover:underline disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}

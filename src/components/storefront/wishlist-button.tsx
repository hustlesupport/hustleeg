"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/actions/account";
import { useLocale } from "@/components/storefront/locale-provider";

export function WishlistButton({
  productId,
  initialWishlisted,
  signedIn,
}: {
  productId: string;
  initialWishlisted: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!signedIn) {
      router.push(`/account/login?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      setWishlisted(result.wishlisted);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`w-full border py-3 font-mono text-sm uppercase tracking-widest disabled:opacity-40 ${
        wishlisted ? "border-matte-black bg-matte-black text-off-white" : "border-matte-black/30 hover:border-matte-black"
      }`}
    >
      {wishlisted ? t("product_saved_to_wishlist") : t("product_add_to_wishlist")}
    </button>
  );
}

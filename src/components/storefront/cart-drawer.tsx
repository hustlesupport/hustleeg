"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/storefront/cart-provider";
import { useLocale } from "@/components/storefront/locale-provider";
import { PromoCodeField } from "@/components/storefront/promo-code-field";
import { formatMoney } from "@/lib/format";

const FREE_SHIPPING_THRESHOLD = 2500;

export function CartDrawer() {
  const { cart, isOpen, close, updateQuantity, removeItem, saveForLater, moveToCart, isLoading } = useCart();
  const { t } = useLocale();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.subtotal);
  const progress = Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-matte-black/50 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-off-white shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-matte-black/10 px-6 py-4">
          <h2 className="font-display text-lg">{t("cart_title")} ({cart.itemCount})</h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="font-mono text-sm tracking-wide hover:text-neon-accent"
          >
            {t("cart_close")}
          </button>
        </div>

        <div className="border-b border-matte-black/10 px-6 py-3">
          <p className="font-mono text-xs text-concrete-grey mb-2">
            {remaining > 0
              ? `${formatMoney(remaining, cart.currency)} ${t("cart_free_shipping_away")}`
              : t("cart_free_shipping_unlocked")}
          </p>
          <div className="h-1 w-full bg-matte-black/10">
            <div
              className="h-1 bg-neon-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {cart.items.length === 0 && (
            <p className="text-concrete-grey text-sm">{t("cart_empty")}</p>
          )}
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-24 w-20 flex-shrink-0 bg-concrete-grey/20">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-ui text-sm">{item.productName}</p>
                <p className="font-mono text-xs text-concrete-grey">
                  {item.size} / {item.color}
                </p>
                <p className="font-mono text-sm mt-1">{formatMoney(item.price, cart.currency)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    disabled={isLoading}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-7 w-7 border border-matte-black/20 font-mono disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="font-mono text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    disabled={isLoading || item.quantity >= item.maxQuantity}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-7 w-7 border border-matte-black/20 font-mono disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => saveForLater(item.id)}
                    className="font-mono text-xs text-concrete-grey underline"
                  >
                    Save for later
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => removeItem(item.id)}
                    className="ml-auto font-mono text-xs text-concrete-grey underline"
                  >
                    {t("cart_remove")}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {cart.savedItems.length > 0 && (
            <div className="border-t border-matte-black/10 pt-4">
              <p className="font-mono text-xs uppercase tracking-widest text-concrete-grey mb-3">
                Saved for later ({cart.savedItems.length})
              </p>
              <div className="space-y-4">
                {cart.savedItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-16 flex-shrink-0 bg-concrete-grey/20 opacity-70">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-ui text-sm text-matte-black/70">{item.productName}</p>
                      <p className="font-mono text-xs text-concrete-grey">
                        {item.size} / {item.color}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          disabled={isLoading || item.maxQuantity === 0}
                          onClick={() => moveToCart(item.id)}
                          className="font-mono text-xs underline disabled:opacity-40"
                        >
                          {item.maxQuantity === 0 ? "Sold out" : "Move to bag"}
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => removeItem(item.id)}
                          className="ml-auto font-mono text-xs text-concrete-grey underline"
                        >
                          {t("cart_remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-matte-black/10 px-6 py-4 space-y-3">
          <PromoCodeField currency={cart.currency} />
          <div className="flex justify-between font-ui">
            <span>{t("cart_subtotal")}</span>
            <span>{formatMoney(cart.subtotal, cart.currency)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={close}
            className={`block w-full bg-matte-black text-off-white text-center py-3 font-mono text-sm tracking-widest uppercase ${
              cart.items.length === 0 ? "pointer-events-none opacity-40" : "hover:bg-neon-accent hover:text-matte-black"
            }`}
          >
            {t("cart_checkout")}
          </Link>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/storefront/cart-provider";
import { useLocale } from "@/components/storefront/locale-provider";
import { PromoCodeField } from "@/components/storefront/promo-code-field";
import { placeOrderAction } from "@/actions/checkout";
import type { AppliedDiscount } from "@/actions/discount";
import { calculateShipping, estimatedDeliveryDays } from "@/lib/shipping";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";
import { formatMoney } from "@/lib/format";

type SavedAddress = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  building: string | null;
  apartment: string | null;
  isDefault: boolean;
};

type AddressForm = {
  fullName: string;
  phone: string;
  governorate: (typeof EGYPT_GOVERNORATES)[number];
  city: string;
  area: string;
  street: string;
  building: string;
  apartment: string;
};

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  phone: "",
  governorate: "Cairo",
  city: "",
  area: "",
  street: "",
  building: "",
  apartment: "",
};

export function CheckoutForm({
  savedAddresses = [],
  defaultEmail,
  defaultPhone,
}: {
  savedAddresses?: SavedAddress[];
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const { cart, refresh } = useCart();
  const { t } = useLocale();
  const router = useRouter();
  const defaultSaved = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [email, setEmail] = useState(defaultEmail ?? "");
  const [notes, setNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState(defaultSaved?.id ?? "new");
  const [address, setAddress] = useState<AddressForm>(
    defaultSaved
      ? {
          fullName: defaultSaved.fullName,
          phone: defaultSaved.phone,
          governorate: defaultSaved.governorate as AddressForm["governorate"],
          city: defaultSaved.city,
          area: defaultSaved.area,
          street: defaultSaved.street,
          building: defaultSaved.building ?? "",
          apartment: defaultSaved.apartment ?? "",
        }
      : { ...EMPTY_ADDRESS, phone: defaultPhone ?? "" }
  );
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [isPending, startTransition] = useTransition();

  const shipping = useMemo(
    () => (discount?.freeShipping ? 0 : calculateShipping(address.governorate, cart.subtotal)),
    [address.governorate, cart.subtotal, discount]
  );
  const total = Math.max(0, cart.subtotal - (discount?.amount ?? 0)) + shipping;

  function selectSavedAddress(id: string) {
    setSelectedAddressId(id);
    if (id === "new") {
      setAddress({ ...EMPTY_ADDRESS, phone: defaultPhone ?? "" });
      return;
    }
    const saved = savedAddresses.find((a) => a.id === id);
    if (!saved) return;
    setAddress({
      fullName: saved.fullName,
      phone: saved.phone,
      governorate: saved.governorate as AddressForm["governorate"],
      city: saved.city,
      area: saved.area,
      street: saved.street,
      building: saved.building ?? "",
      apartment: saved.apartment ?? "",
    });
  }

  function findMissingFields(): string[] {
    const missing: string[] = [];
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) missing.push(t("checkout_email"));
    if (!address.fullName.trim()) missing.push(t("checkout_full_name"));
    if (!address.phone.trim()) missing.push(t("checkout_phone"));
    if (!address.city.trim()) missing.push(t("checkout_city"));
    if (!address.area.trim()) missing.push(t("checkout_area"));
    if (!address.street.trim()) missing.push(t("checkout_street"));
    return missing;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validated and reported entirely in our own UI below — `noValidate` on
    // the <form> keeps the browser's native "Please fill out this field"
    // popups (Chrome/OS-styled, not on-brand) from ever appearing.
    const missing = findMissingFields();
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}.`);
      return;
    }

    startTransition(async () => {
      try {
        const result = await placeOrderAction({
          fullName: address.fullName,
          phone: address.phone,
          email,
          governorate: address.governorate,
          city: address.city,
          area: address.area,
          street: address.street,
          building: address.building,
          apartment: address.apartment,
          notes,
          paymentMethod: "COD",
        });
        await refresh();
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        router.push(`/orders/${result.orderNumber}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not place order.");
      }
    });
  }

  if (cart.items.length === 0) {
    return <p className="font-mono text-sm text-concrete-grey">{t("cart_empty")}</p>;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <h2 className="font-display text-xl mb-4">{t("checkout_contact")}</h2>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("checkout_email")}
            className="input w-full"
          />
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">{t("checkout_shipping_address")}</h2>

          {savedAddresses.length > 0 && (
            <select
              value={selectedAddressId}
              onChange={(e) => selectSavedAddress(e.target.value)}
              className="input w-full mb-4"
            >
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || a.fullName} — {a.area}, {a.city}
                </option>
              ))}
              <option value="new">Use a new address</option>
            </select>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={address.fullName}
              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
              placeholder={t("checkout_full_name")}
              className="input"
            />
            <input
              required
              type="tel"
              value={address.phone}
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              placeholder={t("checkout_phone")}
              className="input"
            />
            <select
              value={address.governorate}
              onChange={(e) => setAddress({ ...address, governorate: e.target.value as AddressForm["governorate"] })}
              className="input"
            >
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              required
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              placeholder={t("checkout_city")}
              className="input"
            />
            <input
              required
              value={address.area}
              onChange={(e) => setAddress({ ...address, area: e.target.value })}
              placeholder={t("checkout_area")}
              className="input"
            />
            <input
              required
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder={t("checkout_street")}
              className="input"
            />
            <input
              value={address.building}
              onChange={(e) => setAddress({ ...address, building: e.target.value })}
              placeholder="Building (optional)"
              className="input"
            />
            <input
              value={address.apartment}
              onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
              placeholder="Apartment (optional)"
              className="input"
            />
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Gift note or delivery instructions (optional)"
            className="input mt-4 w-full"
            rows={3}
          />
          <p className="font-mono text-xs text-concrete-grey mt-2">
            Estimated delivery: {estimatedDeliveryDays(address.governorate)}
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">{t("checkout_payment")}</h2>
          {/* Card checkout is temporarily disabled — see the paymentMethod
              schema in src/actions/checkout.ts. Only one method right now,
              so this is informational rather than a choice. */}
          <div className="flex items-center gap-3 border border-matte-black/20 px-4 py-3 font-mono text-sm">
            {t("checkout_cod")}
          </div>
        </div>

        {error && <p className="font-mono text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-matte-black py-4 font-mono text-sm uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black disabled:opacity-40"
        >
          {isPending ? "…" : `${t("checkout_place_order")} — ${formatMoney(total, cart.currency)}`}
        </button>
      </form>

      <div className="border border-matte-black/10 p-6 h-fit">
        <h2 className="font-display text-lg mb-4">{t("checkout_order_summary")}</h2>
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between font-mono text-xs">
              <span>
                {item.productName} ({item.size}) × {item.quantity}
              </span>
              <span>{formatMoney(item.lineTotal, cart.currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <PromoCodeField currency={cart.currency} onChange={setDiscount} />
        </div>

        <div className="mt-4 space-y-2 border-t border-matte-black/10 pt-4 font-mono text-sm">
          <div className="flex justify-between">
            <span>{t("cart_subtotal")}</span>
            <span>{formatMoney(cart.subtotal, cart.currency)}</span>
          </div>
          {discount && (
            <div className="flex justify-between text-neon-accent">
              <span>{discount.code}</span>
              <span>{discount.freeShipping ? "Free shipping" : `−${formatMoney(discount.amount, cart.currency)}`}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatMoney(shipping, cart.currency)}</span>
          </div>
          <div className="flex justify-between font-ui text-base pt-2 border-t border-matte-black/10">
            <span>Total</span>
            <span>{formatMoney(total, cart.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

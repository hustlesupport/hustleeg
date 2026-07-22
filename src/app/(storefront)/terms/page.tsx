import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-matte-black">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">Legal</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Terms of Service</h1>
      <p className="mb-6 font-mono text-xs text-concrete-grey">Last updated: [DATE]</p>

      <div className="space-y-8 font-ui text-sm leading-relaxed text-matte-black/90">
        <section>
          <h2 className="font-display text-xl mb-3">1. Orders</h2>
          <p>
            Placing an order is an offer to buy — we confirm the contract of sale once your order
            is accepted and payment is verified. Prices are listed in EGP and may change without
            notice for future orders; confirmed orders keep the price charged at checkout.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">2. Drops and limited releases</h2>
          <p>
            Some products are released as limited drops with a purchase limit per customer.
            Orders that appear to circumvent these limits (e.g. duplicate accounts) may be
            cancelled at our discretion.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">3. Payment</h2>
          <p>
            Payment is processed securely through our payment partner at the time of checkout. We
            do not store your full card details.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">4. Shipping and delivery</h2>
          <p>
            Estimated delivery times are shown at checkout and are not guaranteed. Risk of loss
            passes to you once an order is handed to the courier.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">5. Returns</h2>
          <p>
            See our <Link href="/returns" className="underline hover:text-neon-accent">Returns Policy</Link> for eligibility and process.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">6. Contact</h2>
          <p>Questions about these terms — reach us at [SUPPORT EMAIL].</p>
        </section>
      </div>
    </div>
  );
}

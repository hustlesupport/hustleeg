import Link from "next/link";

export const metadata = { title: "Returns Policy" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-matte-black">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">Legal</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Returns &amp; Refunds</h1>
      <p className="mb-6 font-mono text-xs text-concrete-grey">Last updated: [DATE]</p>

      <div className="space-y-8 font-ui text-sm leading-relaxed text-matte-black/90">
        <section>
          <h2 className="font-display text-xl mb-3">1. Return window</h2>
          <p>
            You can request a return within [14] days of delivery. Items must be unworn, unwashed,
            and in their original packaging with tags attached.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">2. Non-returnable items</h2>
          <p>
            Limited drop items marked final sale, and any item explicitly flagged as non-returnable
            on its product page, cannot be returned or exchanged.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">3. How to start a return</h2>
          <p>
            Go to your <Link href="/orders" className="underline hover:text-neon-accent">order history</Link>, select the order, and choose &quot;Request return&quot;. We&apos;ll
            arrange courier pickup or provide drop-off instructions.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">4. Refunds</h2>
          <p>
            Once we receive and inspect the returned item, refunds are issued to your original
            payment method within [5–10] business days.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">5. Exchanges</h2>
          <p>
            Need a different size or color? Request an exchange the same way as a return — subject
            to stock availability.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">6. Contact</h2>
          <p>Questions about a return — reach us at [SUPPORT EMAIL].</p>
        </section>
      </div>
    </div>
  );
}

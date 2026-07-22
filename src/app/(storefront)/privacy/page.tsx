export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-matte-black">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-3">Legal</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Privacy Policy</h1>
      <p className="mb-6 font-mono text-xs text-concrete-grey">Last updated: [DATE]</p>

      <div className="space-y-8 font-ui text-sm leading-relaxed text-matte-black/90">
        <section>
          <h2 className="font-display text-xl mb-3">1. Information we collect</h2>
          <p>
            When you browse Hustle or place an order, we collect information you provide directly
            (name, email, phone number, shipping address) and information collected automatically
            (device, browser, pages viewed, and referral source) to operate the store and improve
            it.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">2. How we use it</h2>
          <p>
            We use your information to process orders, arrange shipping, send order and account
            notifications (email, SMS, or WhatsApp), prevent fraud, and — where you&apos;ve opted
            in — send updates about new drops and campaigns.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">3. Sharing</h2>
          <p>
            We share the minimum data necessary with the services that power checkout, delivery,
            and payments (payment processor, courier partner) so they can fulfil your order. We do
            not sell your personal data to third parties.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">4. Your choices</h2>
          <p>
            You can update your account details at any time from your account page, unsubscribe
            from marketing messages via the link in any email, and request deletion of your
            account and associated data by contacting us.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl mb-3">5. Contact</h2>
          <p>Questions about this policy — reach us at [SUPPORT EMAIL].</p>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { Countdown } from "@/components/storefront/countdown";
import { WaitlistForm } from "@/components/storefront/waitlist-form";

export const revalidate = 30;
export const metadata = { title: "Drops" };

export default async function DropsPage() {
  const [upcoming, live, archived] = await Promise.all([
    db.campaign.findMany({ where: { status: "UPCOMING" }, orderBy: { startAt: "asc" } }),
    db.campaign.findMany({ where: { status: "LIVE" }, orderBy: { startAt: "desc" } }),
    db.campaign.findMany({ where: { status: "ARCHIVED" }, orderBy: { endAt: "desc" }, take: 12 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-20">
      {live.length > 0 && (
        <section>
          <h1 className="font-display text-3xl mb-8">Live now</h1>
          <div className="space-y-6">
            {live.map((c) => (
              <Link key={c.id} href={`/collections/drop/${c.slug}`} className="block border border-matte-black/10 p-6 hover:border-matte-black">
                <p className="font-mono text-xs uppercase tracking-widest text-neon-accent mb-2">Live</p>
                <p className="font-display text-2xl">{c.name}</p>
                {c.tagline && <p className="font-ui text-sm mt-2 text-concrete-grey">{c.tagline}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-8">Coming soon</h2>
        <div className="space-y-6">
          {upcoming.map((c) => (
            <div key={c.id} className="bg-matte-black text-off-white p-8">
              <p className="font-display text-2xl mb-2">{c.name}</p>
              {c.tagline && <p className="font-ui text-sm text-off-white/70 mb-4">{c.tagline}</p>}
              {c.startAt && <Countdown target={c.startAt} />}
              <div className="mt-6 max-w-sm">
                <WaitlistForm campaignId={c.id} />
              </div>
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="font-mono text-sm text-concrete-grey">Nothing teased yet — check back soon.</p>
          )}
        </div>
      </section>

      {archived.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-8">Archive</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {archived.map((c) => (
              <Link key={c.id} href={`/collections/drop/${c.slug}`} className="border border-matte-black/10 p-4 hover:border-matte-black">
                <p className="font-ui text-sm">{c.name}</p>
                <p className="font-mono text-xs text-concrete-grey mt-1">Sold out</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

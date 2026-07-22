"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";

type Result = {
  slug: string;
  name: string;
  basePrice: number;
  currency: string;
  images: { url: string; alt: string | null }[];
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query is too short
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products or campaigns…"
        className="w-full border-b border-matte-black/20 bg-transparent py-4 font-display text-2xl outline-none placeholder:text-concrete-grey"
      />
      <div className="mt-8 divide-y divide-matte-black/10">
        {results.map((r) => (
          <Link key={r.slug} href={`/products/${r.slug}`} className="flex items-center gap-4 py-4">
            <div className="relative h-16 w-14 flex-shrink-0 bg-concrete-grey/15">
              {r.images[0] && (
                <Image src={r.images[0].url} alt={r.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-ui text-sm">{r.name}</p>
              <p className="font-mono text-xs text-concrete-grey">{formatMoney(r.basePrice, r.currency)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

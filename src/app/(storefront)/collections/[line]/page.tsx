import { notFound } from "next/navigation";
import { getProductsByLine } from "@/lib/queries/products";
import { ProductCard } from "@/components/storefront/product-card";
import type { Metadata } from "next";

export const revalidate = 60;

const LINE_MAP = {
  essentials: "ESSENTIALS",
  studio: "STUDIO",
  graffiti: "GRAFFITI",
} as const;

type LineSlug = keyof typeof LINE_MAP;

function isLineSlug(value: string): value is LineSlug {
  return value in LINE_MAP;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ line: string }>;
}): Promise<Metadata> {
  const { line } = await params;
  return { title: isLineSlug(line) ? line[0].toUpperCase() + line.slice(1) : "Collection" };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ line: string }>;
}) {
  const { line } = await params;
  if (!isLineSlug(line)) notFound();

  const products = await getProductsByLine(LINE_MAP[line]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-display text-3xl mb-2 capitalize">{line}</h1>
      <p className="font-mono text-xs text-concrete-grey mb-10">{products.length} pieces</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.length === 0 && (
          <p className="col-span-full font-mono text-sm text-concrete-grey">
            Nothing live in this line yet.
          </p>
        )}
      </div>
    </div>
  );
}

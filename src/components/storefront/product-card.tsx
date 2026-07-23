import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";

export function ProductCard({
  product,
}: {
  product: {
    slug: string;
    name: string;
    basePrice: number;
    currency: string;
    totalStock: number;
    images: { url: string; alt: string | null }[];
  };
}) {
  const [primary, secondary] = product.images;
  const lowStock = product.totalStock > 0 && product.totalStock <= 6;
  const soldOut = product.totalStock === 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-concrete-grey/15">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              secondary ? "transition-opacity group-hover:opacity-0" : ""
            }`}
          />
        )}
        {secondary && (
          <Image
            src={secondary.url}
            alt={secondary.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 bg-matte-black text-off-white font-mono text-[10px] uppercase px-2 py-1">
            Sold out
          </span>
        )}
        {!soldOut && lowStock && (
          <span className="absolute left-2 top-2 bg-neon-accent text-matte-black font-mono text-[10px] uppercase px-2 py-1">
            {product.totalStock} left
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-ui text-sm">{product.name}</p>
        <p className="font-mono text-sm">{formatMoney(product.basePrice, product.currency)}</p>
      </div>
    </Link>
  );
}

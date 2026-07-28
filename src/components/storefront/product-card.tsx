import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";

export type ProductCardProps = {
  product: {
    id?: string;
    slug: string;
    name: string;
    line?: string;
    basePrice: number;
    currency: string;
    totalStock: number;
    images: { url: string; alt: string | null }[];
  };
  promotion?: {
    badge: string | null;
    discountedPrice: number | null;
    promotionTitle: string | null;
    isAutomatic?: boolean;
  } | null;
};

export function ProductCard({ product, promotion }: ProductCardProps) {
  const [primary, secondary] = product.images;
  const lowStock = product.totalStock > 0 && product.totalStock <= 6;
  const soldOut = product.totalStock === 0;

  const hasDiscount = promotion?.discountedPrice && promotion.discountedPrice < product.basePrice;

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

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1 z-10">
          {soldOut && (
            <span className="bg-matte-black text-off-white font-mono text-[10px] uppercase px-2 py-1">
              Sold out
            </span>
          )}
          {!soldOut && promotion?.badge && (
            <span className="bg-neon-accent text-matte-black font-mono text-[10px] uppercase font-bold px-2 py-1 shadow-sm">
              {promotion.badge}
            </span>
          )}
          {!soldOut && lowStock && !promotion?.badge && (
            <span className="bg-neon-accent text-matte-black font-mono text-[10px] uppercase px-2 py-1">
              {product.totalStock} left
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-ui text-sm">{product.name}</p>
        <div className="text-right">
          {hasDiscount ? (
            <div className="flex items-center gap-1.5 font-mono text-sm">
              <span className="line-through text-concrete-grey text-xs">
                {formatMoney(product.basePrice, product.currency)}
              </span>
              <span className="font-bold text-matte-black">
                {formatMoney(promotion.discountedPrice!, product.currency)}
              </span>
            </div>
          ) : (
            <p className="font-mono text-sm">{formatMoney(product.basePrice, product.currency)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

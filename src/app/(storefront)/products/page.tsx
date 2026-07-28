import { getAllProducts } from "@/lib/queries/products";
import { getActiveStorePromotions, getProductPromotionBadge } from "@/lib/queries/promotions";
import { ProductCard } from "@/components/storefront/product-card";

export const revalidate = 30;
export const metadata = { title: "Shop All" };

export default async function ShopAllPage() {
  const [products, activePromotions] = await Promise.all([
    getAllProducts(),
    getActiveStorePromotions().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-display text-3xl mb-2">Shop All</h1>
      <p className="font-mono text-xs text-concrete-grey mb-10">{products.length} pieces</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            promotion={getProductPromotionBadge({ id: product.id, line: product.line, basePrice: product.basePrice }, activePromotions)}
          />
        ))}
        {products.length === 0 && (
          <p className="col-span-full font-mono text-sm text-concrete-grey">
            No products published yet — add some from the admin.
          </p>
        )}
      </div>
    </div>
  );
}

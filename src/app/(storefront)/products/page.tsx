import { getAllProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/storefront/product-card";

export const revalidate = 60;
export const metadata = { title: "Shop All" };

export default async function ShopAllPage() {
  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-display text-3xl mb-2">Shop All</h1>
      <p className="font-mono text-xs text-concrete-grey mb-10">{products.length} pieces</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
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

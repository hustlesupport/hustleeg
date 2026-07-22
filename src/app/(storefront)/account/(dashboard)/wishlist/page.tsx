import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/storefront/product-card";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const items = await db.wishlistItem.findMany({
    where: { customerId: customer.id },
    orderBy: { addedAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 2 },
          variants: { select: { inventory: { select: { quantity: true } } } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Wishlist</h1>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
        {items.map(({ product }) => (
          <ProductCard
            key={product.id}
            product={{
              slug: product.slug,
              name: product.name,
              basePrice: Number(product.basePrice),
              currency: product.currency,
              images: product.images,
              totalStock: product.variants.reduce(
                (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
                0
              ),
            }}
          />
        ))}
        {items.length === 0 && (
          <p className="col-span-full font-mono text-sm text-concrete-grey">
            Nothing saved yet — tap the heart on any product to add it here.
          </p>
        )}
      </div>
    </div>
  );
}

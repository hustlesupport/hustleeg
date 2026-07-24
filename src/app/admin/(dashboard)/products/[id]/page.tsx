import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { StockByLocation } from "@/components/admin/stock-by-location";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, campaigns, locations] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } }, variants: { include: { inventory: true } } },
    }),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
    db.inventoryLocation.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const stockMap: Record<string, Record<string, number>> = {};
  for (const v of product.variants) {
    stockMap[v.id] = {};
    for (const inv of v.inventory) {
      stockMap[v.id][inv.locationId] = inv.quantity;
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Edit product</h1>
      <ProductForm
        campaigns={campaigns}
        initial={{
          id: product.id,
          name: product.name,
          nameAr: product.nameAr ?? "",
          line: product.line,
          campaignId: product.campaignId,
          description: product.description ?? "",
          descriptionAr: product.descriptionAr ?? "",
          fabric: product.fabric ?? "",
          care: product.care ?? "",
          story: product.story ?? "",
          storyAr: product.storyAr ?? "",
          sizeChartUrl: product.sizeChartUrl ?? "",
          basePrice: Number(product.basePrice),
          currency: product.currency,
          status: product.status,
          images: product.images.map((img) => ({ url: img.url, alt: img.alt ?? "", type: img.type })),
          variants: product.variants.map((v) => ({
            size: v.size,
            color: v.color,
            sku: v.sku,
            quantity: v.inventory.reduce((s, i) => s + i.quantity, 0),
          })),
        }}
      />

      {locations.length > 0 && (
        <div className="mt-12 max-w-3xl">
          <h2 className="font-display text-lg mb-4">Stock by location</h2>
          <StockByLocation
            variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku }))}
            locations={locations.map((l) => ({ id: l.id, name: l.name }))}
            initialStock={stockMap}
          />
        </div>
      )}
    </div>
  );
}

"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidatePrefix } from "@/lib/cache";
import { slugify } from "@/lib/format";
import { parseCsv, stringifyCsv, csvRowsToObjects } from "@/lib/csv";

const CSV_HEADERS = [
  "product_slug",
  "product_name",
  "line",
  "base_price",
  "currency",
  "status",
  "description",
  "fabric",
  "care",
  "story",
  "images",
  "variant_size",
  "variant_color",
  "variant_sku",
  "quantity",
];

export async function exportProductsCsvAction(): Promise<string> {
  await requireAdmin();

  const products = await db.product.findMany({
    include: { variants: { include: { inventory: true } }, images: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const rows: (string | number)[][] = [];
  for (const p of products) {
    const imageUrls = p.images.map((i) => i.url).join("|");
    for (const v of p.variants) {
      const quantity = v.inventory.reduce((sum, i) => sum + i.quantity, 0);
      rows.push([
        p.slug,
        p.name,
        p.line,
        Number(p.basePrice),
        p.currency,
        p.status,
        p.description ?? "",
        p.fabric ?? "",
        p.care ?? "",
        p.story ?? "",
        imageUrls,
        v.size,
        v.color,
        v.sku,
        quantity,
      ]);
    }
  }

  return stringifyCsv(CSV_HEADERS, rows);
}

async function getDefaultLocationId() {
  const existing = await db.inventoryLocation.findFirst({ where: { name: "Main Warehouse" } });
  if (existing) return existing.id;
  return (await db.inventoryLocation.create({ data: { name: "Main Warehouse", type: "WAREHOUSE" } })).id;
}

export type CsvImportResult = { productsCreated: number; productsUpdated: number; variantsWritten: number; errors: string[] };

export async function importProductsCsvAction(csvText: string): Promise<CsvImportResult> {
  await requireAdmin();
  const locationId = await getDefaultLocationId();

  const rows = csvRowsToObjects(parseCsv(csvText));
  const bySlug = new Map<string, typeof rows>();
  for (const row of rows) {
    const slug = row.product_slug || slugify(row.product_name || "");
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(row);
  }

  const result: CsvImportResult = { productsCreated: 0, productsUpdated: 0, variantsWritten: 0, errors: [] };

  for (const [slug, variantRows] of bySlug) {
    const first = variantRows[0];
    if (!first.product_name || !first.line || !first.base_price) {
      result.errors.push(`Skipped "${slug}" — missing product_name/line/base_price.`);
      continue;
    }
    if (!["ESSENTIALS", "GRAFFITI"].includes(first.line)) {
      result.errors.push(`Skipped "${slug}" — invalid line "${first.line}".`);
      continue;
    }

    const existing = await db.product.findUnique({ where: { slug } });

    const productData = {
      name: first.product_name,
      line: first.line as "ESSENTIALS" | "GRAFFITI",
      basePrice: Number(first.base_price),
      currency: first.currency || "EGP",
      status: (["DRAFT", "SCHEDULED", "ACTIVE", "ARCHIVED"].includes(first.status) ? first.status : "DRAFT") as
        | "DRAFT"
        | "SCHEDULED"
        | "ACTIVE"
        | "ARCHIVED",
      description: first.description || null,
      fabric: first.fabric || null,
      care: first.care || null,
      story: first.story || null,
    };

    const product = existing
      ? await db.product.update({ where: { id: existing.id }, data: productData })
      : await db.product.create({ data: { ...productData, slug } });

    if (existing) result.productsUpdated++;
    else result.productsCreated++;

    if (first.images) {
      const urls = first.images.split("|").map((u) => u.trim()).filter(Boolean);
      if (urls.length) {
        await db.productImage.deleteMany({ where: { productId: product.id } });
        await db.productImage.createMany({
          data: urls.map((url, i) => ({ productId: product.id, url, position: i })),
        });
      }
    }

    for (const row of variantRows) {
      if (!row.variant_size || !row.variant_color || !row.variant_sku) {
        result.errors.push(`Skipped a variant row for "${slug}" — missing size/color/sku.`);
        continue;
      }
      const quantity = Number(row.quantity) || 0;

      const variant = await db.productVariant.upsert({
        where: { sku: row.variant_sku },
        create: {
          productId: product.id,
          size: row.variant_size,
          color: row.variant_color,
          sku: row.variant_sku,
        },
        update: {
          productId: product.id,
          size: row.variant_size,
          color: row.variant_color,
        },
      });

      await db.inventoryItem.upsert({
        where: { variantId_locationId: { variantId: variant.id, locationId } },
        create: { variantId: variant.id, locationId, quantity },
        update: { quantity },
      });

      result.variantsWritten++;
    }

    await invalidatePrefix(`product:${slug}`);
  }

  await invalidatePrefix("products:");

  return result;
}

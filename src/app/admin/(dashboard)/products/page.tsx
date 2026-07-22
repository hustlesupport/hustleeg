import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { CsvImportExport } from "@/components/admin/csv-import-export";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: { include: { inventory: true } } },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-matte-black px-5 py-2 font-mono text-xs uppercase tracking-widest text-off-white hover:bg-neon-accent hover:text-matte-black"
        >
          New product
        </Link>
      </div>

      <div className="mb-8">
        <CsvImportExport />
      </div>

      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-matte-black/10 text-left text-concrete-grey">
            <th className="py-2">Name</th>
            <th className="py-2">Line</th>
            <th className="py-2">Price</th>
            <th className="py-2">Stock</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const stock = p.variants.reduce(
              (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
              0
            );
            return (
              <tr key={p.id} className="border-b border-matte-black/5">
                <td className="py-3">{p.name}</td>
                <td className="py-3 capitalize">{p.line.toLowerCase()}</td>
                <td className="py-3">{formatMoney(Number(p.basePrice), p.currency)}</td>
                <td className="py-3">{stock}</td>
                <td className="py-3">
                  <span
                    className={
                      p.status === "ACTIVE"
                        ? "text-neon-accent"
                        : p.status === "DRAFT"
                        ? "text-concrete-grey"
                        : "text-matte-black/40"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-neon-accent">
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-concrete-grey">
                No products yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

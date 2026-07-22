import { db } from "@/lib/db";
import { LocationManager } from "@/components/admin/location-manager";

export const metadata = { title: "Locations" };

export default async function AdminLocationsPage() {
  const locations = await db.inventoryLocation.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl mb-2">Locations</h1>
      <p className="font-mono text-xs text-concrete-grey mb-8">
        Manage warehouse/studio/pop-up locations. Adjust per-variant stock at each location from a product&rsquo;s
        edit page.
      </p>
      <LocationManager locations={locations} />
    </div>
  );
}

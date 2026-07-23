import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const LINES = ["essentials", "studio", "graffiti"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, campaigns] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    }),
    db.campaign.findMany({
      where: { status: { in: ["LIVE", "UPCOMING", "ENDED"] } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/returns`, changeFrequency: "yearly", priority: 0.2 },
    ...LINES.map((line) => ({
      url: `${SITE_URL}/collections/${line}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((c) => ({
    url: `${SITE_URL}/collections/drop/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...campaignRoutes];
}

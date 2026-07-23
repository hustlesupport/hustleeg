import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const PLACEHOLDER = (seed: string, w = 1200, h = 1500) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  const location = await db.inventoryLocation.upsert({
    where: { id: "seed-main-warehouse" },
    update: {},
    create: { id: "seed-main-warehouse", name: "Main Warehouse", type: "WAREHOUSE" },
  });

  const ownerEmail = process.env.SEED_ADMIN_EMAIL ?? "owner@hustle.com";
  const ownerPassword = process.env.SEED_ADMIN_PASSWORD ?? "hustle-admin-2026";
  await db.adminUser.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      passwordHash: await bcrypt.hash(ownerPassword, 12),
      name: "Hustle Owner",
      role: "OWNER",
    },
  });

  const foundations = await db.campaign.upsert({
    where: { slug: "foundations" },
    update: {},
    create: {
      name: "Foundations",
      slug: "foundations",
      tagline: "The pieces everything else is built on.",
      story: "Foundations is where Hustle starts — core silhouettes, matte black, no noise.",
      heroImageUrl: PLACEHOLDER("foundations-hero", 1600, 1000),
      status: "LIVE",
      startAt: new Date(Date.now() - 3 * 86_400_000),
      endAt: new Date(Date.now() + 27 * 86_400_000),
    },
  });

  const afterHours = await db.campaign.upsert({
    where: { slug: "after-hours" },
    update: {},
    create: {
      name: "After Hours",
      slug: "after-hours",
      tagline: "For the city after midnight.",
      story: "After Hours drops next — darker palette, heavier fabric, limited run.",
      heroImageUrl: PLACEHOLDER("after-hours-hero", 1600, 1000),
      status: "UPCOMING",
      startAt: new Date(Date.now() + 5 * 86_400_000),
    },
  });

  await db.campaign.upsert({
    where: { slug: "city-code" },
    update: {},
    create: {
      name: "City Code",
      slug: "city-code",
      tagline: "Cairo, in fabric.",
      status: "ARCHIVED",
      startAt: new Date(Date.now() - 120 * 86_400_000),
      endAt: new Date(Date.now() - 90 * 86_400_000),
    },
  });

  const productsSeed = [
    {
      name: "Foundations Tee",
      line: "ESSENTIALS" as const,
      campaignId: foundations.id,
      description: "The core tee. Heavyweight cotton, boxy fit, built to last every wash.",
      fabric: "240gsm combed cotton",
      care: "Cold wash, hang dry",
      story: "The first piece in the Foundations drop.",
      basePrice: 950,
      colors: ["Matte Black", "Off White"],
    },
    {
      name: "Foundations Hoodie",
      line: "ESSENTIALS" as const,
      campaignId: foundations.id,
      description: "Heavyweight fleece hoodie with a dropped shoulder and kangaroo pocket.",
      fabric: "400gsm brushed fleece",
      care: "Cold wash, do not tumble dry",
      story: "Layered for Cairo winters, cut for everyday wear.",
      basePrice: 2200,
      colors: ["Matte Black", "Concrete Grey"],
    },
    {
      name: "Studio Wide Pant",
      line: "GRAFFITI" as const,
      campaignId: foundations.id,
      description: "Wide-leg utility pant with a tapered ankle and articulated knee.",
      fabric: "Cotton ripstop",
      care: "Cold wash inside out",
      story: "Built in the studio for movement, not just standing still.",
      basePrice: 
      2650,
      colors: ["Concrete Grey"],
    },
    {
      name: "Graffiti Overshirt",
      line: "GRAFFITI" as const,
      campaignId: null,
      description: "Hand-finished overshirt with graffiti-tag embroidery on the back panel.",
      fabric: "Brushed twill",
      care: "Dry clean recommended",
      story: "Every piece in the Graffiti line is finished by hand in the studio.",
      basePrice: 3200,
      colors: ["Matte Black"],
    },
    {
      name: "After Hours Crewneck",
      line: "GRAFFITI" as const,
      campaignId: afterHours.id,
      description: "Midweight crewneck for the drop that starts after midnight.",
      fabric: "320gsm fleece",
      care: "Cold wash, hang dry",
      story: "Drops with After Hours.",
      basePrice: 1850,
      colors: ["Matte Black"],
    },
    {
      name: "Essentials Cap",
      line: "ESSENTIALS" as const,
      campaignId: null,
      description: "Structured 6-panel cap with embroidered wordmark.",
      fabric: "Cotton twill",
      care: "Spot clean",
      story: "The finishing piece for any fit.",
      basePrice: 750,
      colors: ["Matte Black", "Off White"],
    },
  ];

  const sizesFor = (name: string) => (name.includes("Cap") ? ["One Size"] : ["S", "M", "L", "XL"]);

  for (const p of productsSeed) {
    const slug = p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) continue;

    const product = await db.product.create({
      data: {
        name: p.name,
        slug,
        line: p.line,
        campaignId: p.campaignId,
        description: p.description,
        fabric: p.fabric,
        care: p.care,
        story: p.story,
        basePrice: p.basePrice,
        currency: "EGP",
        status: "ACTIVE",
        images: {
          create: [
            { url: PLACEHOLDER(`${slug}-1`), type: "STUDIO", position: 0 },
            { url: PLACEHOLDER(`${slug}-2`), type: "EDITORIAL", position: 1 },
            { url: PLACEHOLDER(`${slug}-3`), type: "MOVEMENT", position: 2 },
          ],
        },
      },
    });

    const sizes = sizesFor(p.name);
    for (const color of p.colors) {
      for (const size of sizes) {
        const sku = `${slug.toUpperCase().replace(/-/g, "")}-${size}-${color.slice(0, 3).toUpperCase()}`;
        await db.productVariant.create({
          data: {
            productId: product.id,
            size,
            color,
            sku,
            inventory: {
              create: { locationId: location.id, quantity: Math.floor(Math.random() * 20) + 3 },
            },
          },
        });
      }
    }
  }

  await db.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      active: true,
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${ownerEmail} / ${ownerPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

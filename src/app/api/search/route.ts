import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";

// Simple synonym map so "hoodie" also matches "crewneck" etc (blueprint p.06).
const SYNONYMS: Record<string, string[]> = {
  hoodie: ["crewneck", "sweatshirt"],
  crewneck: ["hoodie", "sweatshirt"],
  tee: ["t-shirt", "shirt"],
  shirt: ["tee", "t-shirt"],
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const terms = [q, ...(SYNONYMS[q] ?? [])];

  const results = await cached(`search:${q}`, 30, async () =>
    db.product.findMany({
      where: {
        status: "ACTIVE",
        OR: terms.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })),
      },
      take: 8,
      select: {
        slug: true,
        name: true,
        basePrice: true,
        currency: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    })
  );

  return NextResponse.json({
    results: results.map((r) => ({ ...r, basePrice: Number(r.basePrice) })),
  });
}

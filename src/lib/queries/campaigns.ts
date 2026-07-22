import "server-only";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";

export async function getLiveCampaign() {
  return cached("campaign:live", 30, () =>
    db.campaign.findFirst({
      where: { status: "LIVE" },
      orderBy: { startAt: "desc" },
    })
  );
}

export async function getUpcomingCampaign() {
  return cached("campaign:upcoming", 30, () =>
    db.campaign.findFirst({
      where: { status: "UPCOMING" },
      orderBy: { startAt: "asc" },
    })
  );
}

export async function getCampaignBySlug(slug: string) {
  return cached(`campaign:${slug}`, 60, () =>
    db.campaign.findUnique({
      where: { slug },
      include: { products: { where: { status: "ACTIVE" }, include: { images: true, variants: { include: { inventory: true } } } } },
    })
  );
}

export async function getArchivedCampaigns() {
  return cached("campaign:archived", 300, () =>
    db.campaign.findMany({ where: { status: "ARCHIVED" }, orderBy: { endAt: "desc" } })
  );
}

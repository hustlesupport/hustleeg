const TIER_RANK: Record<string, number> = { MEMBER: 0, INSIDER: 1, VIP: 2 };

export function meetsTier(customerTier: string, requiredTier: string) {
  return (TIER_RANK[customerTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

export function hasEarlyAccess(
  campaign: { earlyAccessAt: Date | null; earlyAccessTier: string | null; startAt: Date | null },
  customer: { loyaltyTier: string } | null
) {
  if (!campaign.earlyAccessAt || !campaign.earlyAccessTier || !customer) return false;
  const now = Date.now();
  if (now < campaign.earlyAccessAt.getTime()) return false;
  if (campaign.startAt && now >= campaign.startAt.getTime()) return false; // public window already open
  return meetsTier(customer.loyaltyTier, campaign.earlyAccessTier);
}

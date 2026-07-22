-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "purchaseLimitPerCustomer" INTEGER,
ADD COLUMN     "raffleDrawnAt" TIMESTAMP(3),
ADD COLUMN     "raffleMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RaffleEntry" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackInStockAlert" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackInStockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RaffleEntry_campaignId_idx" ON "RaffleEntry"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleEntry_campaignId_email_key" ON "RaffleEntry"("campaignId", "email");

-- CreateIndex
CREATE INDEX "BackInStockAlert_variantId_idx" ON "BackInStockAlert"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "BackInStockAlert_variantId_email_key" ON "BackInStockAlert"("variantId", "email");

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackInStockAlert" ADD CONSTRAINT "BackInStockAlert_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackInStockAlert" ADD CONSTRAINT "BackInStockAlert_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;


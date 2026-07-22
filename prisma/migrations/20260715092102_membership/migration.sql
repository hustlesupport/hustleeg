-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('RETURN', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "earlyAccessAt" TIMESTAMP(3),
ADD COLUMN     "earlyAccessTier" "LoyaltyTier";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "memberNumber" TEXT NOT NULL,
ADD COLUMN     "preferredSize" TEXT,
ADD COLUMN     "referralCode" TEXT NOT NULL,
ADD COLUMN     "referralRewardGranted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referredByCode" TEXT,
ADD COLUMN     "referredByCustomerId" TEXT,
ALTER COLUMN "passwordHash" SET NOT NULL;

-- AlterTable
ALTER TABLE "JournalPost" ADD COLUMN     "membersOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "ReturnType" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerId_idx" ON "ReturnRequest"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_memberNumber_key" ON "Customer"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_referralCode_key" ON "Customer"("referralCode");

-- CreateIndex
CREATE INDEX "Customer_memberNumber_idx" ON "Customer"("memberNumber");

-- CreateIndex
CREATE INDEX "Customer_referralCode_idx" ON "Customer"("referralCode");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_referredByCustomerId_fkey" FOREIGN KEY ("referredByCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;


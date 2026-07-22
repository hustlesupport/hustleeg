-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "storyAr" TEXT,
ADD COLUMN     "taglineAr" TEXT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "savedForLater" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JournalPost" ADD COLUMN     "bodyAr" TEXT,
ADD COLUMN     "excerptAr" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "storyAr" TEXT;


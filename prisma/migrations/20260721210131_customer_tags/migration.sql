-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];


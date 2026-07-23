-- AlterEnum
BEGIN;
CREATE TYPE "ProductLine_new" AS ENUM ('ESSENTIALS', 'GRAFFITI');
ALTER TABLE "Product" ALTER COLUMN "line" TYPE "ProductLine_new" USING ("line"::text::"ProductLine_new");
ALTER TYPE "ProductLine" RENAME TO "ProductLine_old";
ALTER TYPE "ProductLine_new" RENAME TO "ProductLine";
DROP TYPE "ProductLine_old";
COMMIT;

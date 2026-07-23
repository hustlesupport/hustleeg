/*
  Warnings:

  - You are about to drop the `JournalPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JournalPost" DROP CONSTRAINT "JournalPost_campaignId_fkey";

-- DropTable
DROP TABLE "JournalPost";

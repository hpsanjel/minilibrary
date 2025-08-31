/*
  Warnings:

  - You are about to drop the `Issue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Return` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "condition" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "returnNotes" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "returnedAt" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Issue";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Return";
PRAGMA foreign_keys=on;

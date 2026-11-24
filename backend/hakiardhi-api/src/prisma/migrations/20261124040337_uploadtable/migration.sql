/*
  Warnings:

  - Added the required column `landParcelId` to the `TransactionHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransactionHistory" ADD COLUMN     "landParcelId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "TransferDocuments" (
    "id" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "trasnferId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TransferDocuments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "LandParcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDocuments" ADD CONSTRAINT "TransferDocuments_trasnferId_fkey" FOREIGN KEY ("trasnferId") REFERENCES "TransactionHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

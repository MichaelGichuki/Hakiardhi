/*
  Warnings:

  - A unique constraint covering the columns `[registration]` on the table `LandOwner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[titleNumber]` on the table `OwnershipRecords` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phoneNumber` to the `LandOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration` to the `LandOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blockchainRecord` to the `OwnershipRecords` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredAt` to the `OwnershipRecords` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sha256` to the `OwnershipRecords` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleNumber` to the `OwnershipRecords` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleVersionNumber` to the `OwnershipRecords` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LandOwner" ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "registration" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LandParcels" ADD COLUMN     "parcelOriginId" UUID;

-- AlterTable
ALTER TABLE "OwnershipRecords" ADD COLUMN     "blockchainRecord" TEXT NOT NULL,
ADD COLUMN     "registeredAt" TEXT NOT NULL,
ADD COLUMN     "sha256" TEXT NOT NULL,
ADD COLUMN     "titleNumber" TEXT NOT NULL,
ADD COLUMN     "titleVersionNumber" INTEGER NOT NULL,
ADD COLUMN     "updateById" UUID;

-- CreateTable
CREATE TABLE "TransactionHistory" (
    "id" UUID NOT NULL,
    "refrerence" TEXT NOT NULL,
    "landOwnerId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionLog" (
    "id" UUID NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "landParcelId" UUID NOT NULL,
    "changedFeilds" TEXT,
    "digest" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,

    CONSTRAINT "InspectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLogs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "status" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updateat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionHistory_refrerence_key" ON "TransactionHistory"("refrerence");

-- CreateIndex
CREATE UNIQUE INDEX "LandOwner_registration_key" ON "LandOwner"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "OwnershipRecords_titleNumber_key" ON "OwnershipRecords"("titleNumber");

-- AddForeignKey
ALTER TABLE "LandParcels" ADD CONSTRAINT "LandParcels_parcelOriginId_fkey" FOREIGN KEY ("parcelOriginId") REFERENCES "LandParcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipRecords" ADD CONSTRAINT "OwnershipRecords_updateById_fkey" FOREIGN KEY ("updateById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_landOwnerId_fkey" FOREIGN KEY ("landOwnerId") REFERENCES "LandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "LandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionLog" ADD CONSTRAINT "InspectionLog_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "LandParcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLogs" ADD CONSTRAINT "RequestLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLogs" ADD CONSTRAINT "RequestLogs_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "TransactionHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

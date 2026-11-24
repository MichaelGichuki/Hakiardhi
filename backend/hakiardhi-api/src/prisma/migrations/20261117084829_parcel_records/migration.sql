/*
  Warnings:

  - You are about to drop the column `landId` on the `LandOwner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parcelNumber]` on the table `LandParcels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `LandOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `county` to the `LandParcels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parcelNumber` to the `LandParcels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenure` to the `LandParcels` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LandOwner" DROP CONSTRAINT "LandOwner_landId_fkey";

-- AlterTable
ALTER TABLE "LandOwner" DROP COLUMN "landId",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LandParcels" ADD COLUMN     "county" TEXT NOT NULL,
ADD COLUMN     "parcelNumber" TEXT NOT NULL,
ADD COLUMN     "tenure" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "OwnershipRecords" (
    "id" UUID NOT NULL,
    "landParcelId" UUID NOT NULL,
    "landOwnerId" UUID NOT NULL,
    "legerRefernce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnershipRecords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnershipRecords_landParcelId_key" ON "OwnershipRecords"("landParcelId");

-- CreateIndex
CREATE UNIQUE INDEX "LandParcels_parcelNumber_key" ON "LandParcels"("parcelNumber");

-- AddForeignKey
ALTER TABLE "OwnershipRecords" ADD CONSTRAINT "OwnershipRecords_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "LandParcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipRecords" ADD CONSTRAINT "OwnershipRecords_landOwnerId_fkey" FOREIGN KEY ("landOwnerId") REFERENCES "LandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

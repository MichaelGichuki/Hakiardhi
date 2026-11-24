-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandParcels" (
    "id" UUID NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "log" DOUBLE PRECISION NOT NULL,
    "Size" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandParcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandOwner" (
    "id" UUID NOT NULL,
    "landId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "LandOwner" ADD CONSTRAINT "LandOwner_landId_fkey" FOREIGN KEY ("landId") REFERENCES "LandParcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

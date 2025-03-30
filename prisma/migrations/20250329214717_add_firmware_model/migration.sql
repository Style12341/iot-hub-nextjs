/*
  Warnings:

  - A unique constraint covering the columns `[activeFirmwareId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assignedFirmwareId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "activeFirmwareId" TEXT,
ADD COLUMN     "assignedFirmwareId" TEXT;

-- CreateTable
CREATE TABLE "Firmware" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "checksum" TEXT,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firmware_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_activeFirmwareId_key" ON "Device"("activeFirmwareId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_assignedFirmwareId_key" ON "Device"("assignedFirmwareId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_activeFirmwareId_fkey" FOREIGN KEY ("activeFirmwareId") REFERENCES "Firmware"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_assignedFirmwareId_fkey" FOREIGN KEY ("assignedFirmwareId") REFERENCES "Firmware"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firmware" ADD CONSTRAINT "Firmware_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

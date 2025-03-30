/*
  Warnings:

  - A unique constraint covering the columns `[deviceId,version]` on the table `Firmware` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Firmware_deviceId_version_key" ON "Firmware"("deviceId", "version");

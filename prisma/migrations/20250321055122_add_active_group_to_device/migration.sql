/*
  Warnings:

  - A unique constraint covering the columns `[activeGroupId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "activeGroupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Device_activeGroupId_key" ON "Device"("activeGroupId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_activeGroupId_fkey" FOREIGN KEY ("activeGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `categoryId` to the `Sensor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SensorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

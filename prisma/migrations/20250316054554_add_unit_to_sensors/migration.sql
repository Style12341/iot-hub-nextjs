/*
  Warnings:

  - Added the required column `unit` to the `Sensor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "unit" TEXT NOT NULL;

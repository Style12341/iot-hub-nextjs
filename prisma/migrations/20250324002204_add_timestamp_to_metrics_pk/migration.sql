/*
  Warnings:

  - The primary key for the `Metric` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Metric" DROP CONSTRAINT "Metric_pkey",
ADD CONSTRAINT "Metric_pkey" PRIMARY KEY ("name", "userId", "timestamp");

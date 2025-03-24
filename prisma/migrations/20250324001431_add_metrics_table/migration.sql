-- CreateEnum
CREATE TYPE "Metrics" AS ENUM ('SENSOR_VALUES_PER_MINUTE');

-- CreateTable
CREATE TABLE "Metric" (
    "name" "Metrics" NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("name","userId")
);

-- CreateIndex
CREATE INDEX "Metric_timestamp_idx" ON "Metric"("timestamp");

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

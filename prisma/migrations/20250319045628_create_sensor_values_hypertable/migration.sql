-- Add timescable extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
-- CreateTable
CREATE TABLE "SensorValue" (
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "groupSensorId" TEXT NOT NULL,

    CONSTRAINT "SensorValue_pkey" PRIMARY KEY ("timestamp","groupSensorId")
);

-- AddForeignKey
ALTER TABLE "SensorValue" ADD CONSTRAINT "SensorValue_groupSensorId_fkey" FOREIGN KEY ("groupSensorId") REFERENCES "GroupSensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Create hypertable
SELECT create_hypertable('"SensorValue"',by_range('timestamp',INTERVAL '1 day'))
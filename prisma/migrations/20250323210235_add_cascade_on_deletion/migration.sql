-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "GroupSensor" DROP CONSTRAINT "GroupSensor_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupSensor" DROP CONSTRAINT "GroupSensor_sensorId_fkey";

-- DropForeignKey
ALTER TABLE "Sensor" DROP CONSTRAINT "Sensor_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Sensor" DROP CONSTRAINT "Sensor_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "SensorCategory" DROP CONSTRAINT "SensorCategory_userId_fkey";

-- DropForeignKey
ALTER TABLE "SensorValue" DROP CONSTRAINT "SensorValue_groupSensorId_fkey";

-- DropForeignKey
ALTER TABLE "UserTokens" DROP CONSTRAINT "UserTokens_userId_fkey";

-- AlterTable
ALTER TABLE "Sensor" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SensorCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorCategory" ADD CONSTRAINT "SensorCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSensor" ADD CONSTRAINT "GroupSensor_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSensor" ADD CONSTRAINT "GroupSensor_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorValue" ADD CONSTRAINT "SensorValue_groupSensorId_fkey" FOREIGN KEY ("groupSensorId") REFERENCES "GroupSensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokens" ADD CONSTRAINT "UserTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

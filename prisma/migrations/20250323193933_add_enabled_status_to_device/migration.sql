-- AlterEnum
ALTER TYPE "DeviceStatus" ADD VALUE 'ENABLED';

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "lastValueAt" DROP NOT NULL,
ALTER COLUMN "lastValueAt" DROP DEFAULT;

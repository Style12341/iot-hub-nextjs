/*
  Warnings:

  - A unique constraint covering the columns `[defaultViewId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "viewId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultViewId" TEXT;

-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "View_name_userId_key" ON "View"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_defaultViewId_key" ON "User"("defaultViewId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultViewId_fkey" FOREIGN KEY ("defaultViewId") REFERENCES "View"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

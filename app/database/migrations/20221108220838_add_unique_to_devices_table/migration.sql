/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Devices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Devices_userId_key" ON "Devices"("userId");

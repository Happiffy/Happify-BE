CREATE TYPE "DeviceStatus" AS ENUM ('UNPAIRED', 'PAIRED', 'REVOKED');
CREATE TYPE "DevicePairingStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "displayName" TEXT,
    "claimSecretDigest" TEXT NOT NULL,
    "ownerId" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'UNPAIRED',
    "pairedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DevicePairingSession" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DevicePairingStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DevicePairingSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");
CREATE INDEX "Device_ownerId_updatedAt_idx" ON "Device"("ownerId", "updatedAt");
CREATE INDEX "Device_status_idx" ON "Device"("status");
CREATE INDEX "DevicePairingSession_userId_createdAt_idx" ON "DevicePairingSession"("userId", "createdAt");
CREATE INDEX "DevicePairingSession_deviceId_status_idx" ON "DevicePairingSession"("deviceId", "status");
CREATE INDEX "DevicePairingSession_status_expiresAt_idx" ON "DevicePairingSession"("status", "expiresAt");

ALTER TABLE "Device" ADD CONSTRAINT "Device_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DevicePairingSession" ADD CONSTRAINT "DevicePairingSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DevicePairingSession" ADD CONSTRAINT "DevicePairingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

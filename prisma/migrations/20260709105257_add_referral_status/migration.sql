-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Referral_status_createdAt_idx" ON "Referral"("status", "createdAt");

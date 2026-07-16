-- AlterTable
ALTER TABLE "Referral" ADD COLUMN "backgroundSnapshot" JSONB,
ADD COLUMN "psychologistId" TEXT,
ADD COLUMN "requestComment" TEXT,
ADD COLUMN "reviewerComment" TEXT;

-- AlterTable
ALTER TABLE "PsychologistApplication" ADD COLUMN "reviewComment" TEXT;

-- CreateTable
CREATE TABLE "CareChatSession" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_psychologistId_createdAt_idx" ON "Referral"("psychologistId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CareChatSession_referralId_key" ON "CareChatSession"("referralId");

-- CreateIndex
CREATE INDEX "CareChatSession_userId_updatedAt_idx" ON "CareChatSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CareChatSession_psychologistId_updatedAt_idx" ON "CareChatSession"("psychologistId", "updatedAt");

-- CreateIndex
CREATE INDEX "CareChatMessage_sessionId_createdAt_idx" ON "CareChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "CareChatMessage_senderId_createdAt_idx" ON "CareChatMessage"("senderId", "createdAt");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareChatSession" ADD CONSTRAINT "CareChatSession_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareChatSession" ADD CONSTRAINT "CareChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareChatSession" ADD CONSTRAINT "CareChatSession_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareChatMessage" ADD CONSTRAINT "CareChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CareChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareChatMessage" ADD CONSTRAINT "CareChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

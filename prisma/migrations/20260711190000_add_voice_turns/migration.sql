CREATE TABLE "VoiceTurn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upstreamAudioPath" TEXT,
    "audioExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceTurn_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VoiceTurn_userId_createdAt_idx" ON "VoiceTurn"("userId", "createdAt");
CREATE INDEX "VoiceTurn_audioExpiresAt_idx" ON "VoiceTurn"("audioExpiresAt");
ALTER TABLE "VoiceTurn" ADD CONSTRAINT "VoiceTurn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

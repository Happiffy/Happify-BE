ALTER TABLE "VoiceTurn"
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "detectedMood" "MoodState",
ADD COLUMN "emotionConfidence" DOUBLE PRECISION;

CREATE INDEX "VoiceTurn_userId_sessionId_createdAt_idx" ON "VoiceTurn"("userId", "sessionId", "createdAt");
CREATE INDEX "VoiceTurn_detectedMood_createdAt_idx" ON "VoiceTurn"("detectedMood", "createdAt");

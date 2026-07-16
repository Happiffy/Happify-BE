ALTER TABLE "MsUserPreference"
  ADD COLUMN IF NOT EXISTS "careChatNotifications" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "referralNotifications" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "moodReminderNotifications" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "wellbeingUpdateNotifications" BOOLEAN NOT NULL DEFAULT false;

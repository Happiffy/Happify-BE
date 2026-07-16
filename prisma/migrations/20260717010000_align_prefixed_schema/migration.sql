DO $$
DECLARE
  table_name_pair record;
BEGIN
  FOR table_name_pair IN
    SELECT * FROM (VALUES
      ('User', 'MsUser'),
      ('ConsentDocument', 'MsConsentDocument'),
      ('UserConsent', 'TrUserConsent'),
      ('FcmToken', 'TrFcmToken'),
      ('Device', 'MsDevice'),
      ('DevicePairingSession', 'TrDevicePairingSession'),
      ('DeviceCredential', 'TrDeviceCredential'),
      ('DeviceTelemetry', 'TrDeviceTelemetry'),
      ('DeviceEmotionObservation', 'TrDeviceEmotionObservation'),
      ('DeviceCheckIn', 'TrDeviceCheckIn'),
      ('DeviceCommand', 'TrDeviceCommand'),
      ('FirmwareRelease', 'MsFirmwareRelease'),
      ('DeviceOtaDeployment', 'TrDeviceOtaDeployment'),
      ('VoiceTurn', 'TrVoiceTurn'),
      ('Mood', 'TrMoodEntry'),
      ('JournalEntry', 'TrJournalEntry'),
      ('CommunityPost', 'TrCommunityPost'),
      ('CommunitySupport', 'TrCommunitySupport'),
      ('CommunityComment', 'TrCommunityComment'),
      ('CommunityReport', 'TrCommunityReport'),
      ('CommunityModerationAudit', 'TrCommunityModerationAudit'),
      ('MoodGeoPoint', 'TrMoodGeoPoint'),
      ('HeatmapContribution', 'TrHeatmapContribution'),
      ('UserPreference', 'MsUserPreference'),
      ('Referral', 'TrReferral'),
      ('PsychologistApplication', 'TrPsychologistApplication'),
      ('CareChatSession', 'TrCareChatSession'),
      ('CareChatMessage', 'TrCareChatMessage'),
      ('DailyMotivation', 'MsDailyMotivation'),
      ('MindfulnessActivity', 'MsMindfulnessActivity'),
      ('MindfulnessProgress', 'TrMindfulnessProgress'),
      ('EmergencyContact', 'MsEmergencyContact'),
      ('Provider', 'MsProvider')
    ) AS names(legacy_name, target_name)
  LOOP
    IF to_regclass(format('public.%I', table_name_pair.legacy_name)) IS NOT NULL
      AND to_regclass(format('public.%I', table_name_pair.target_name)) IS NULL THEN
      EXECUTE format('ALTER TABLE %I RENAME TO %I', table_name_pair.legacy_name, table_name_pair.target_name);
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS "MsRole" (
  "code" TEXT PRIMARY KEY
);

INSERT INTO "MsRole" ("code")
VALUES ('USER'), ('PSYCHOLOGIST'), ('MODERATOR'), ('ADMIN')
ON CONFLICT ("code") DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public."MsUser"') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'MsUser'
        AND column_name = 'role'
        AND udt_name = 'UserRole'
    ) THEN
    ALTER TABLE "MsUser" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
  END IF;

  IF to_regclass('public."MsUser"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public."MsUser"'::regclass
        AND contype = 'f'
        AND confrelid = 'public."MsRole"'::regclass
    ) THEN
    ALTER TABLE "MsUser"
      ADD CONSTRAINT "MsUser_role_fkey"
      FOREIGN KEY ("role") REFERENCES "MsRole"("code")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

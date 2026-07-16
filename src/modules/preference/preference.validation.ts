import { z } from 'zod';

export const accessibilitySchema = z.object({
  textScale: z.enum(['SMALL', 'STANDARD', 'LARGE', 'EXTRA_LARGE']).default('STANDARD'),
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  screenReaderOptimized: z.boolean().default(false),
});

export const notificationPreferencesSchema = z.object({
  careChat: z.boolean().default(false),
  referral: z.boolean().default(false),
  moodReminders: z.boolean().default(false),
  wellbeingUpdates: z.boolean().default(false),
});

export const preferenceSchema = z.object({
  primaryGoal: z.string().trim().min(1).max(120),
  triggers: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  supportTone: z.string().trim().min(1).max(80),
  highRiskAction: z.string().trim().min(1).max(120),
  accessibilityMode: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  accessibility: accessibilitySchema.default({ textScale: 'STANDARD', highContrast: false, reducedMotion: false, screenReaderOptimized: false }),
  consentToAi: z.boolean().default(false),
  notifications: notificationPreferencesSchema.default({ careChat: false, referral: false, moodReminders: false, wellbeingUpdates: false }),
});

export const notificationPreferencesPatchSchema = notificationPreferencesSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one notification preference is required.');

export type PreferenceDTO = z.infer<typeof preferenceSchema>;
export type NotificationPreferencesPatchDTO = z.infer<typeof notificationPreferencesPatchSchema>;

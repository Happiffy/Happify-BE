import { z } from 'zod';

export const preferenceSchema = z.object({
  userId: z.string().min(1),
  primaryGoal: z.string().min(1),
  triggers: z.array(z.string()).default([]),
  supportTone: z.string().min(1),
  highRiskAction: z.string().min(1),
  accessibilityMode: z.array(z.string()).default([]),
  consentToAi: z.boolean().default(false),
});

export type PreferenceDTO = z.infer<typeof preferenceSchema>;

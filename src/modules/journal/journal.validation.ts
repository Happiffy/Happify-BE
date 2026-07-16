import { z } from 'zod';
import { moodStateSchema, riskLevelSchema } from '@/modules/shared.validation.js';

export const createJournalSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(120),
  content: z.string().trim().min(1, 'Journal content is required'),
  imageUrl: z.string().url().optional(),
  detectedMood: moodStateSchema.optional(),
  riskLevel: riskLevelSchema.default('LOW'),
  aiReflection: z.string().optional(),
});

export type CreateJournalDTO = z.infer<typeof createJournalSchema>;

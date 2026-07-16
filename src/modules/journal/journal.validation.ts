import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createJournalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1, 'Journal content is required').max(20000),
  imageUrl: z.string().url().max(2000).optional(),
  detectedMood: moodStateSchema.optional(),
});

export type CreateJournalDTO = z.infer<typeof createJournalSchema>;

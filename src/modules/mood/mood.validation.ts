import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createMoodSchema = z.object({
  state: moodStateSchema,
  intensity: z.number().int().min(1).max(5).default(3),
  triggers: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  note: z.string().trim().max(1000).optional(),
});

export type CreateMoodDTO = z.infer<typeof createMoodSchema>;

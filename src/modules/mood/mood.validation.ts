import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createMoodSchema = z.object({
  userId: z.string().min(1),
  state: moodStateSchema,
  intensity: z.number().int().min(1).max(5).default(3),
  triggers: z.array(z.string()).default([]),
  note: z.string().optional(),
});

export type CreateMoodDTO = z.infer<typeof createMoodSchema>;

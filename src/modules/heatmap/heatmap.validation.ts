import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const heatmapQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const heatmapContributionSchema = z.object({
  regionKey: z.string().trim().toUpperCase().min(2).max(40).regex(/^[A-Z0-9_-]+$/),
  mood: moodStateSchema,
});

export type HeatmapContributionDTO = z.infer<typeof heatmapContributionSchema>;

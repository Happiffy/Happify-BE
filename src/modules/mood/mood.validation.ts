import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createMoodSchema = z.object({
  state: moodStateSchema,
  intensity: z.number().int().min(1).max(5).default(3),
  triggers: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  note: z.string().trim().max(1000).optional(),
});

export const moodListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) context.addIssue({ code: 'custom', message: 'startDate and endDate must be provided together.' });
  if (value.startDate && value.endDate && (value.endDate.getTime() < value.startDate.getTime() || value.endDate.getTime() - value.startDate.getTime() > 89 * 86400000)) context.addIssue({ code: 'custom', message: 'Date range must be between 0 and 90 days.' });
});

export type CreateMoodDTO = z.infer<typeof createMoodSchema>;
export type MoodListQuery = z.infer<typeof moodListQuerySchema>;

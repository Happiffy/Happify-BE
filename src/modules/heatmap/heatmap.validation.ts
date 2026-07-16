import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const heatmapQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    context.addIssue({ code: 'custom', message: 'startDate and endDate must be provided together.' });
    return;
  }
  if (!value.startDate || !value.endDate) return;
  const duration = value.endDate.getTime() - value.startDate.getTime();
  if (duration < 0) context.addIssue({ code: 'custom', message: 'endDate must not be before startDate.' });
  if (duration > 89 * 86400000) context.addIssue({ code: 'custom', message: 'Date range cannot exceed 90 days.' });
});

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;

export const heatmapContributionSchema = z.object({
  regionKey: z.string().trim().toUpperCase().min(2).max(40).regex(/^[A-Z0-9_-]+$/),
  mood: moodStateSchema,
});

export type HeatmapContributionDTO = z.infer<typeof heatmapContributionSchema>;

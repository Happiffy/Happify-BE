import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createJournalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1, 'Journal content is required').max(20000),
  imageUrl: z.string().url().max(2000).optional(),
  detectedMood: moodStateSchema.optional(),
});

export const journalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) context.addIssue({ code: 'custom', message: 'startDate and endDate must be provided together.' });
  if (value.startDate && value.endDate && (value.endDate.getTime() < value.startDate.getTime() || value.endDate.getTime() - value.startDate.getTime() > 89 * 86400000)) context.addIssue({ code: 'custom', message: 'Date range must be between 0 and 90 days.' });
});

export type CreateJournalDTO = z.infer<typeof createJournalSchema>;
export type JournalListQuery = z.infer<typeof journalListQuerySchema>;

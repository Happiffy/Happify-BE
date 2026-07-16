import { z } from 'zod';

export const moodStateSchema = z.enum(['HAPPY', 'CALM', 'NEUTRAL', 'ANXIOUS', 'SAD', 'DISTRESSED']);
export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRISIS']);
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  page: z.coerce.number().int().min(1).default(1),
});
export const idParamSchema = z.object({ id: z.string().cuid() });

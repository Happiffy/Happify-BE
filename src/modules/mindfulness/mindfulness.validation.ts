import { z } from 'zod';
export const mindfulnessQuerySchema = z.object({ locale: z.string().trim().toLowerCase().min(2).max(10).default('id'), type: z.enum(['BREATHING', 'MEDITATION', 'GROUNDING']).optional() });
export const mindfulnessProgressSchema = z.object({ activityId: z.string().cuid(), progressSeconds: z.number().int().min(0).max(86400), completed: z.boolean().default(false) });
export type MindfulnessProgressDTO = z.infer<typeof mindfulnessProgressSchema>;

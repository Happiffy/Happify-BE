import { z } from 'zod';

export const analyticsQuerySchema = z.object({ userId: z.string().min(1) });

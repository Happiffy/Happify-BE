import { z } from 'zod';
export const motivationQuerySchema = z.object({ locale: z.string().trim().toLowerCase().min(2).max(10).default('id') });

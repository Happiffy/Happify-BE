import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createCommunityPostSchema = z.object({
  userId: z.string().optional(),
  alias: z.string().default('Anonymous Quokka'),
  content: z.string().min(1).max(600),
  imageUrl: z.string().max(700000).regex(/^(https?:\/\/|data:image\/)/).optional(),
  mood: moodStateSchema.optional(),
});

export type CreateCommunityPostDTO = z.infer<typeof createCommunityPostSchema>;

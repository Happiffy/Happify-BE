import { z } from 'zod';
import { moodStateSchema } from '@/modules/shared.validation.js';

export const createCommunityPostSchema = z.object({
  alias: z.string().trim().min(1).max(60).default('Anonymous Quokka'),
  content: z.string().min(1).max(600),
  imageUrl: z.string().url().max(2000).optional(),
  mood: moodStateSchema.optional(),
});

export const communityListQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export const createCommunityCommentSchema = z.object({
  content: z.string().max(400).default(''),
  imageUrl: z.string().url().max(2000).optional(),
}).refine((value) => value.content.trim() || value.imageUrl, { message: 'Reply text or image is required' });

export const communityReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().cuid(),
  reason: z.enum(['HARASSMENT', 'SELF_HARM', 'SPAM', 'MISINFORMATION', 'PRIVACY', 'OTHER']),
  details: z.string().trim().max(1000).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(['HIDE', 'RESTORE', 'RESOLVE_REPORT', 'DISMISS_REPORT']),
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().cuid(),
  reportId: z.string().cuid().optional(),
  reason: z.string().trim().min(1).max(1000),
});

export type CreateCommunityPostDTO = z.infer<typeof createCommunityPostSchema>;
export type CommunityReportDTO = z.infer<typeof communityReportSchema>;
export type ModerationDTO = z.infer<typeof moderationSchema>;

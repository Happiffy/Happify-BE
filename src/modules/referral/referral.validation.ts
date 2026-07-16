import { z } from 'zod';
import { riskLevelSchema } from '@/modules/shared.validation.js';

export const createReferralSchema = z.object({
  userId: z.string().min(1),
  riskLevel: riskLevelSchema,
  reason: z.string().min(1),
  requestComment: z.string().max(1000).optional(),
  providerName: z.string().optional(),
  providerType: z.string().optional(),
  contactUrl: z.string().url().optional(),
});

export const reviewReferralSchema = z.object({
  psychologistId: z.string().min(1),
  status: z.enum(['ACCEPTED', 'REJECTED']),
  reviewerComment: z.string().max(1000).optional(),
});

export const createCareChatMessageSchema = z.object({
  senderId: z.string().min(1),
  content: z.string().max(1200).default(''),
  imageUrl: z.string().max(700000).regex(/^(https?:\/\/|data:image\/)/).optional(),
}).refine((value) => value.content.trim() || value.imageUrl, { message: 'Message text or image is required' });

export type CreateReferralDTO = z.infer<typeof createReferralSchema>;
export type ReviewReferralDTO = z.infer<typeof reviewReferralSchema>;
export type CreateCareChatMessageDTO = z.infer<typeof createCareChatMessageSchema>;

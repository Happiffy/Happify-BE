import { z } from 'zod';

export const profileQuerySchema = z.object({ userId: z.string().min(1) });

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const psychologistApplicationSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(1).max(120),
  licenseNumber: z.string().min(1).max(120),
  certificateUrl: z.string().min(1).max(500),
  institution: z.string().max(160).optional(),
  reason: z.string().max(800).optional(),
});

export const reviewPsychologistApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewComment: z.string().max(1000).optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type PsychologistApplicationDTO = z.infer<typeof psychologistApplicationSchema>;

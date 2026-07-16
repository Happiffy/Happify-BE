import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().max(2000).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one profile field is required' });

export const psychologistApplicationSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  licenseNumber: z.string().trim().min(3).max(120),
  certificateUrl: z.string().url().max(2000),
  institution: z.string().trim().max(160).optional(),
  reason: z.string().trim().max(800).optional(),
});

export const reviewPsychologistApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewComment: z.string().trim().min(1).max(1000),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type PsychologistApplicationDTO = z.infer<typeof psychologistApplicationSchema>;

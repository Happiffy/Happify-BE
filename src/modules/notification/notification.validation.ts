import { z } from 'zod';

export const notificationPlatformSchema = z.enum(['ANDROID', 'IOS', 'WEB']);

export const registerFcmTokenSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: notificationPlatformSchema,
});

export const removeFcmTokenSchema = z.object({
  token: z.string().trim().min(20).max(4096),
});

export type RegisterFcmTokenDTO = z.infer<typeof registerFcmTokenSchema>;

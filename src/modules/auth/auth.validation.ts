import { z } from 'zod';

export const authVerifySchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().optional(),
  mode: z.enum(['login', 'register']).default('login'),
});

export type AuthVerifyDTO = z.infer<typeof authVerifySchema>;

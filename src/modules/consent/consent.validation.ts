import { z } from 'zod';

export const consentScopeSchema = z.enum(['AI_PROCESSING', 'VOICE_PROCESSING', 'DEVICE_EMOTION_OBSERVATION', 'HEATMAP_CONTRIBUTION']);
export const consentQuerySchema = z.object({ scope: consentScopeSchema.optional() });
export const updateConsentSchema = z.object({
  scope: consentScopeSchema,
  version: z.number().int().positive(),
  accepted: z.boolean(),
  source: z.enum(['WEB', 'MOBILE', 'DEVICE']).default('MOBILE'),
});
export type UpdateConsentDTO = z.infer<typeof updateConsentSchema>;

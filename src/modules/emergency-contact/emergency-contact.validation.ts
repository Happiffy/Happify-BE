import { z } from 'zod';
export const emergencyContactSchema = z.object({ name: z.string().trim().min(1).max(120), relationship: z.string().trim().min(1).max(80), phone: z.string().trim().min(7).max(30).regex(/^\+?[0-9 ()-]+$/), isPrimary: z.boolean().default(false) });
export const updateEmergencyContactSchema = emergencyContactSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });
export type EmergencyContactDTO = z.infer<typeof emergencyContactSchema>;
export type UpdateEmergencyContactDTO = z.infer<typeof updateEmergencyContactSchema>;

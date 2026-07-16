import { z } from 'zod';

export const startPairingSchema = z.object({
  serialNumber: z.string().trim().toUpperCase().min(8).max(80).regex(/^[A-Z0-9-]+$/),
  claimSecret: z.string().min(16).max(256),
});

export const updateDeviceSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
});

import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '@/modules/auth/auth.middleware.js';
import deviceController from '@/modules/device/device.controller.js';
import deviceRepository from '@/modules/device/device.repository.js';
import { createClaimSecretDigest } from '@/modules/device/claim-secret.util.js';
import { deviceCommandTypeSchema } from '@/modules/device/device.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

const router = Router();
router.use(requireRole('ADMIN'));
router.post('/devices', async (request, response) => {
  try {
    const body = z.object({ serialNumber: z.string().trim().toUpperCase().min(8).max(80).regex(/^[A-Z0-9-]+$/), model: z.string().trim().min(1).max(80), claimSecret: z.string().min(16).max(256), hardwareRevision: z.string().trim().min(1).max(60).optional(), bootloaderVersion: z.string().trim().min(1).max(60).optional(), protocolVersion: z.string().trim().min(1).max(60).optional(), supportedCommandTypes: z.array(deviceCommandTypeSchema).default(['HAPTIC_THERAPY']) }).strict().parse(request.body);
    const metadata = { hardwareRevision: body.hardwareRevision ?? null, bootloaderVersion: body.bootloaderVersion ?? null, protocolVersion: body.protocolVersion ?? null, supportedCommandTypes: body.supportedCommandTypes };
    const device = await deviceRepository.device.upsert({ where: { serialNumber: body.serialNumber }, update: { model: body.model, claimSecretDigest: createClaimSecretDigest(body.claimSecret), ownerId: null, status: 'UNPAIRED', pairedAt: null, revokedAt: null, ...metadata }, create: { serialNumber: body.serialNumber, model: body.model, claimSecretDigest: createClaimSecretDigest(body.claimSecret), ...metadata } });
    return response.status(201).json({ status: 'success', data: { device } });
  } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
});
router.post('/firmware', deviceController.createFirmware.bind(deviceController));
export default router;

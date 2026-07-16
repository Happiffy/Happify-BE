import type { NextFunction, Request, Response } from 'express';
import { createRuntimeCredentialDigest } from '@/modules/device/claim-secret.util.js';
import deviceRepository from '@/modules/device/device.repository.js';

export type RuntimeDevice = { id: string; serialNumber: string; model: string; ownerId: string };

export async function requireDeviceAuth(request: Request, response: Response, next: NextFunction) {
  const match = request.headers.authorization?.match(/^Device\s+([^\s]+)$/i);
  if (!match?.[1]) return response.status(401).json({ status: 'error', message: 'DEVICE_UNAUTHENTICATED' });
  try {
    const credential = await deviceRepository.credential.findUnique({
      where: { tokenDigest: createRuntimeCredentialDigest(match[1]) },
      select: { id: true, expiresAt: true, revokedAt: true, device: { select: { id: true, serialNumber: true, model: true, ownerId: true, status: true } } },
    });
    if (!credential || credential.revokedAt || credential.expiresAt <= new Date() || credential.device.status !== 'PAIRED' || !credential.device.ownerId) throw new Error('DEVICE_UNAUTHENTICATED');
    response.locals.runtimeDevice = { id: credential.device.id, serialNumber: credential.device.serialNumber, model: credential.device.model, ownerId: credential.device.ownerId } satisfies RuntimeDevice;
    await deviceRepository.credential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } });
    await deviceRepository.device.update({ where: { id: credential.device.id }, data: { lastSeenAt: new Date() } });
    return next();
  } catch {
    return response.status(401).json({ status: 'error', message: 'DEVICE_UNAUTHENTICATED' });
  }
}

export function getRuntimeDevice(response: Response) {
  const device = response.locals.runtimeDevice as RuntimeDevice | undefined;
  if (!device) throw new Error('DEVICE_UNAUTHENTICATED');
  return device;
}

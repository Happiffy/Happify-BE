import deviceRepository from '@/modules/device/device.repository.js';
import { verifyClaimSecret } from '@/modules/device/claim-secret.util.js';

const sessionTtlMs = Number(process.env.PAIRING_SESSION_TTL_SECONDS ?? 300) * 1000;

class DeviceService {
  list(userId: string) {
    return deviceRepository.device.findMany({
      where: { ownerId: userId },
      select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string, userId: string) {
    const device = await deviceRepository.device.findFirst({
      where: { id, ownerId: userId },
      select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, updatedAt: true },
    });
    if (!device) throw new Error('NOT_FOUND');
    return device;
  }

  async update(id: string, userId: string, displayName: string) {
    await this.get(id, userId);
    return deviceRepository.device.update({ where: { id }, data: { displayName }, select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, updatedAt: true } });
  }

  async startPairing(userId: string, serialNumber: string, claimSecret: string) {
    const device = await deviceRepository.device.findUnique({ where: { serialNumber } });
    if (!device || device.status !== 'UNPAIRED' || device.ownerId || !verifyClaimSecret(claimSecret, device.claimSecretDigest)) throw new Error('PAIRING_INVALID');
    await deviceRepository.pairingSession.updateMany({ where: { userId, deviceId: device.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    return deviceRepository.pairingSession.create({
      data: { userId, deviceId: device.id, expiresAt: new Date(Date.now() + sessionTtlMs) },
      select: { id: true, status: true, expiresAt: true, createdAt: true, device: { select: { id: true, serialNumber: true, model: true } } },
    });
  }

  async getPairing(id: string, userId: string) {
    const session = await deviceRepository.pairingSession.findFirst({ where: { id, userId }, select: { id: true, status: true, expiresAt: true, createdAt: true, device: { select: { id: true, serialNumber: true, model: true, displayName: true } } } });
    if (!session) throw new Error('NOT_FOUND');
    if (session.status === 'PENDING' && session.expiresAt <= new Date()) {
      return deviceRepository.pairingSession.update({ where: { id }, data: { status: 'EXPIRED' }, select: { id: true, status: true, expiresAt: true, createdAt: true, device: { select: { id: true, serialNumber: true, model: true, displayName: true } } } });
    }
    return session;
  }

  async completePairing(id: string, userId: string) {
    return deviceRepository.transaction(async (transaction) => {
      const session = await transaction.devicePairingSession.findFirst({ where: { id, userId, status: 'PENDING' } });
      if (!session || session.expiresAt <= new Date()) throw new Error('PAIRING_INVALID');
      const claimed = await transaction.device.updateMany({ where: { id: session.deviceId, ownerId: null, status: 'UNPAIRED' }, data: { ownerId: userId, status: 'PAIRED', pairedAt: new Date() } });
      if (claimed.count !== 1) throw new Error('DEVICE_ALREADY_PAIRED');
      await transaction.devicePairingSession.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });
      return transaction.device.findUnique({ where: { id: session.deviceId }, select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, updatedAt: true } });
    });
  }

  async cancelPairing(id: string, userId: string) {
    const session = await deviceRepository.pairingSession.findFirst({ where: { id, userId, status: 'PENDING' } });
    if (!session) throw new Error('NOT_FOUND');
    await deviceRepository.pairingSession.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}

export default new DeviceService();

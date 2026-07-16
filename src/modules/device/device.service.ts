import deviceRepository from '@/modules/device/device.repository.js';
import { createClaimSecretDigest, issueRuntimeCredential, verifyClaimSecret } from '@/modules/device/claim-secret.util.js';
import type { DeviceCommandType, Prisma } from '@/generated/prisma/client.js';
import { isFirmwareCompatible } from '@/modules/device/firmware-compatibility.js';
import type { EmotionObservationDTO, HeartbeatDTO, MoodSyncDTO } from '@/modules/device/device.validation.js';

const sessionTtlMs = Number(process.env.PAIRING_SESSION_TTL_SECONDS ?? 300) * 1000;
const observationRetentionDays = Number(process.env.DEVICE_OBSERVATION_RETENTION_DAYS ?? 30);
const activeOtaStatuses = ['PENDING', 'DOWNLOADING', 'INSTALLING'] as const;

class DeviceService {
  async ensureCompanion(userId: string) {
    const serialNumber = `HAPPIFY-${userId.slice(-12).toUpperCase()}`;
    return deviceRepository.device.upsert({
      where: { serialNumber },
      update: {
        ownerId: userId,
        status: 'PAIRED',
        pairedAt: new Date(),
        unpairedAt: null,
        revokedAt: null,
      },
      create: {
        serialNumber,
        model: 'Happify Companion',
        displayName: 'My Happify Companion',
        claimSecretDigest: createClaimSecretDigest(`companion:${userId}`),
        ownerId: userId,
        status: 'PAIRED',
        pairedAt: new Date(),
        supportedCommandTypes: [
          'HAPTIC_THERAPY',
          'DISPLAY_MESSAGE',
          'SET_CONFIGURATION',
          'RESTART',
        ],
      },
      select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, lastSeenAt: true, firmwareVersion: true, hardwareRevision: true, bootloaderVersion: true, protocolVersion: true, supportedCommandTypes: true, updatedAt: true },
    });
  }

  list(userId: string) {
    return deviceRepository.device.findMany({
      where: { ownerId: userId },
      select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, lastSeenAt: true, firmwareVersion: true, hardwareRevision: true, bootloaderVersion: true, protocolVersion: true, supportedCommandTypes: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string, userId: string) {
    const device = await deviceRepository.device.findFirst({
      where: { id, ownerId: userId },
      select: { id: true, serialNumber: true, model: true, displayName: true, status: true, pairedAt: true, lastSeenAt: true, firmwareVersion: true, hardwareRevision: true, bootloaderVersion: true, protocolVersion: true, supportedCommandTypes: true, updatedAt: true },
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
    if (session.status === 'PENDING' && session.expiresAt <= new Date()) return deviceRepository.pairingSession.update({ where: { id }, data: { status: 'EXPIRED' }, select: { id: true, status: true, expiresAt: true, createdAt: true, device: { select: { id: true, serialNumber: true, model: true, displayName: true } } } });
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

  async unpair(id: string, userId: string, revoke = false) {
    return deviceRepository.transaction(async (transaction) => {
      const device = await transaction.device.findFirst({ where: { id, ownerId: userId, status: 'PAIRED' }, select: { id: true } });
      if (!device) throw new Error('NOT_FOUND');
      await transaction.deviceCredential.updateMany({ where: { deviceId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await transaction.deviceCommand.updateMany({ where: { deviceId: id, status: { in: ['PENDING', 'ACKNOWLEDGED'] } }, data: { status: 'CANCELLED', updatedAt: new Date() } });
      await transaction.deviceOtaDeployment.updateMany({ where: { deviceId: id, status: { in: [...activeOtaStatuses] } }, data: { status: 'CANCELLED', updatedAt: new Date() } });
      return transaction.device.update({ where: { id }, data: { ownerId: null, status: revoke ? 'REVOKED' : 'UNPAIRED', unpairedAt: new Date(), revokedAt: revoke ? new Date() : null, pairedAt: null } });
    });
  }

  async issueCredential(id: string, userId: string) {
    const device = await deviceRepository.device.findFirst({ where: { id, ownerId: userId, status: 'PAIRED' }, select: { id: true } });
    if (!device) throw new Error('NOT_FOUND');
    const credential = issueRuntimeCredential();
    const expiresAt = new Date(Date.now() + Number(process.env.DEVICE_CREDENTIAL_TTL_SECONDS ?? 2592000) * 1000);
    await deviceRepository.credential.create({ data: { deviceId: id, tokenDigest: credential.digest, expiresAt } });
    return { token: credential.token, expiresAt };
  }

  ingestTelemetry(deviceId: string, items: Array<{ metric: string; value: number; unit?: string | undefined; recordedAt: Date; metadata?: Record<string, string | number | boolean | null> | undefined }>) {
    return deviceRepository.telemetry.createMany({ data: items.map((item) => ({ deviceId, metric: item.metric, value: item.value, unit: item.unit ?? null, recordedAt: item.recordedAt, ...(item.metadata ? { metadata: item.metadata as Prisma.InputJsonValue } : {}) })) });
  }

  async heartbeat(deviceId: string, body: HeartbeatDTO) {
    const now = new Date();
    return deviceRepository.transaction(async (transaction) => {
      const device = await transaction.device.update({ where: { id: deviceId }, data: { lastSeenAt: now, firmwareVersion: body.firmwareVersion, hardwareRevision: body.hardwareRevision, bootloaderVersion: body.bootloaderVersion, protocolVersion: body.protocolVersion, supportedCommandTypes: body.supportedCommandTypes }, select: { id: true, lastSeenAt: true, firmwareVersion: true, hardwareRevision: true, bootloaderVersion: true, protocolVersion: true, supportedCommandTypes: true } });
      await transaction.deviceTelemetry.create({ data: { deviceId, metric: 'heartbeat', value: 1, unit: 'event', recordedAt: now, metadata: { firmwareVersion: body.firmwareVersion, hardwareRevision: body.hardwareRevision, bootloaderVersion: body.bootloaderVersion, protocolVersion: body.protocolVersion } } });
      return device;
    });
  }

  async listTelemetry(id: string, userId: string, limit: number) {
    await this.get(id, userId);
    return deviceRepository.telemetry.findMany({ where: { deviceId: id }, orderBy: { recordedAt: 'desc' }, take: limit });
  }

  async listFirmwareReleases(id: string, userId: string) {
    const device = await deviceRepository.device.findFirst({
      where: { id, ownerId: userId, status: 'PAIRED' },
      select: { model: true, hardwareRevision: true, bootloaderVersion: true, protocolVersion: true },
    });
    if (!device) throw new Error('NOT_FOUND');
    const releases = await deviceRepository.firmware.findMany({
      where: { model: device.model, status: 'ACTIVE' },
      select: { id: true, model: true, version: true, hardwareRevision: true, minimumBootloaderVersion: true, protocolVersion: true, releaseNotes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return releases
      .filter((release) => isFirmwareCompatible(device, release))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async ingestEmotionObservation(deviceId: string, userId: string, body: EmotionObservationDTO) {
    const existing = await deviceRepository.emotionObservation.findUnique({ where: { deviceId_idempotencyKey: { deviceId, idempotencyKey: body.idempotencyKey } } });
    if (existing) return existing;
    const consent = await deviceRepository.consent.findFirst({ where: { id: body.consentEvidence.consentId, userId, scope: 'DEVICE_EMOTION_OBSERVATION', version: body.consentEvidence.version, status: 'ACCEPTED', revokedAt: null }, select: { id: true, version: true } });
    if (!consent) throw new Error('DEVICE_OBSERVATION_CONSENT_REQUIRED');
    const latestDocument = await deviceRepository.consentDocument.findFirst({ where: { scope: 'DEVICE_EMOTION_OBSERVATION', isActive: true, effectiveAt: { lte: new Date() } }, orderBy: { version: 'desc' }, select: { version: true } });
    if (!latestDocument || latestDocument.version !== consent.version) throw new Error('DEVICE_OBSERVATION_CONSENT_REQUIRED');
    const maximumRetainUntil = new Date(Date.now() + observationRetentionDays * 86400000);
    if (body.retention.retainUntil <= new Date() || body.retention.retainUntil > maximumRetainUntil) throw new Error('INVALID_RETENTION');
    const inputSources = body.inputSources ?? [body.source];
    if ((body.source === 'FUSED' && (!inputSources.includes('VOICE') || !inputSources.includes('CAMERA'))) || (body.source !== 'FUSED' && inputSources.some((source) => source !== body.source))) throw new Error('INVALID_OBSERVATION_SOURCE');
    try {
      return await deviceRepository.emotionObservation.create({ data: { deviceId, userId, source: body.source, inputSources, state: body.state, confidence: body.confidence, riskLevel: body.riskLevel, facePresent: body.facePresent ?? null, eyeContact: body.eyeContact ?? null, ...(body.expressionProbabilities ? { expressionProbabilities: body.expressionProbabilities as Prisma.InputJsonValue } : {}), observationProvider: body.observationProvider.provider, modelName: body.observationProvider.model, modelVersion: body.observationProvider.version, consentId: consent.id, consentVersion: consent.version, retentionPolicy: body.retention.policy, retainUntil: body.retention.retainUntil, idempotencyKey: body.idempotencyKey, observedAt: body.observedAt } });
    } catch (error) {
      const concurrent = await deviceRepository.emotionObservation.findUnique({ where: { deviceId_idempotencyKey: { deviceId, idempotencyKey: body.idempotencyKey } } });
      if (concurrent) return concurrent;
      throw error;
    }
  }

  async syncMood(deviceId: string, userId: string, body: MoodSyncDTO) {
    const existing = await deviceRepository.checkIn.findUnique({ where: { deviceId_idempotencyKey: { deviceId, idempotencyKey: body.idempotencyKey } }, include: { mood: true } });
    if (existing) return existing;
    try {
      return await deviceRepository.transaction(async (transaction) => {
        const mood = await transaction.mood.create({ data: { userId, state: body.state, intensity: body.intensity, triggers: body.triggers, note: body.note ?? null, createdAt: body.observedAt } });
        return transaction.deviceCheckIn.create({ data: { deviceId, userId, moodId: mood.id, kind: body.kind, idempotencyKey: body.idempotencyKey, observedAt: body.observedAt }, include: { mood: true } });
      });
    } catch (error) {
      const concurrent = await deviceRepository.checkIn.findUnique({ where: { deviceId_idempotencyKey: { deviceId, idempotencyKey: body.idempotencyKey } }, include: { mood: true } });
      if (concurrent) return concurrent;
      throw error;
    }
  }

  async createCommand(id: string, userId: string, type: DeviceCommandType, payload: Record<string, unknown>, idempotencyKey?: string) {
    const device = await this.get(id, userId);
    if (device.supportedCommandTypes.length > 0 && !device.supportedCommandTypes.includes(type)) throw new Error('COMMAND_INCOMPATIBLE');
    if (idempotencyKey) {
      const existing = await deviceRepository.command.findUnique({ where: { deviceId_idempotencyKey: { deviceId: id, idempotencyKey } } });
      if (existing) return existing;
    }
    const storedPayload = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
    return deviceRepository.command.create({ data: { deviceId: id, type, payload: storedPayload, idempotencyKey: idempotencyKey ?? null } });
  }

  listPendingCommands(deviceId: string) {
    return deviceRepository.command.findMany({ where: { deviceId, status: { in: ['PENDING', 'ACKNOWLEDGED'] } }, orderBy: { createdAt: 'asc' }, take: 50 });
  }

  async updateCommand(deviceId: string, commandId: string, status: 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED', errorCode?: string) {
    const command = await deviceRepository.command.findFirst({ where: { id: commandId, deviceId } });
    if (!command) throw new Error('NOT_FOUND');
    if (command.type === 'HAPTIC_THERAPY' && status === 'COMPLETED' && !command.acknowledgedAt) throw new Error('INVALID_COMMAND_TRANSITION');
    const valid = (command.status === 'PENDING' && (status === 'ACKNOWLEDGED' || status === 'FAILED')) || (command.status === 'ACKNOWLEDGED' && (status === 'COMPLETED' || status === 'FAILED')) || command.status === status;
    if (!valid) throw new Error('INVALID_COMMAND_TRANSITION');
    if (status === 'FAILED' && !errorCode) throw new Error('COMMAND_ERROR_CODE_REQUIRED');
    return deviceRepository.command.update({ where: { id: commandId }, data: { status, ...(status === 'ACKNOWLEDGED' ? { acknowledgedAt: command.acknowledgedAt ?? new Date() } : {}), ...(status === 'COMPLETED' || status === 'FAILED' ? { completedAt: command.completedAt ?? new Date() } : {}), errorCode: status === 'FAILED' ? errorCode ?? null : null } });
  }

  createFirmware(model: string, version: string, protocolVersion: string, downloadUrl: string, checksumSha256: string, hardwareRevision?: string, minimumBootloaderVersion?: string, releaseNotes?: string) {
    return deviceRepository.firmware.create({ data: { model, version, protocolVersion, downloadUrl, checksumSha256, hardwareRevision: hardwareRevision ?? null, minimumBootloaderVersion: minimumBootloaderVersion ?? null, releaseNotes: releaseNotes ?? null } });
  }

  updateFirmwareStatus(id: string, status: 'ACTIVE' | 'DEPRECATED') {
    return deviceRepository.firmware.update({ where: { id }, data: { status } });
  }

  async createOta(id: string, userId: string, firmwareId: string) {
    const device = await deviceRepository.device.findFirst({ where: { id, ownerId: userId, status: 'PAIRED' }, select: { id: true, model: true, hardwareRevision: true, bootloaderVersion: true, protocolVersion: true } });
    if (!device) throw new Error('NOT_FOUND');
    const firmware = await deviceRepository.firmware.findFirst({ where: { id: firmwareId, status: 'ACTIVE' } });
    if (!firmware || !isFirmwareCompatible(device, firmware)) throw new Error('FIRMWARE_INCOMPATIBLE');
    const active = await deviceRepository.ota.findFirst({ where: { deviceId: id, status: { in: [...activeOtaStatuses] } } });
    if (active) throw new Error('OTA_ALREADY_ACTIVE');
    return deviceRepository.ota.create({ data: { deviceId: id, firmwareId } });
  }

  listPendingOta(deviceId: string) {
    return deviceRepository.ota.findMany({ where: { deviceId, status: { in: [...activeOtaStatuses] } }, include: { firmware: true }, orderBy: { createdAt: 'asc' }, take: 5 });
  }

  async updateOta(deviceId: string, otaId: string, status: 'DOWNLOADING' | 'INSTALLING' | 'SUCCEEDED' | 'FAILED', progress: number, errorCode?: string) {
    const ota = await deviceRepository.ota.findFirst({ where: { id: otaId, deviceId }, include: { firmware: true } });
    if (!ota) throw new Error('NOT_FOUND');
    const transitions: Record<string, readonly string[]> = { PENDING: ['DOWNLOADING', 'FAILED'], DOWNLOADING: ['DOWNLOADING', 'INSTALLING', 'FAILED'], INSTALLING: ['INSTALLING', 'SUCCEEDED', 'FAILED'], SUCCEEDED: ['SUCCEEDED'], FAILED: ['FAILED'] };
    if (!transitions[ota.status]?.includes(status) || progress < ota.progress) throw new Error('INVALID_OTA_TRANSITION');
    return deviceRepository.transaction(async (transaction) => {
      const updated = await transaction.deviceOtaDeployment.update({ where: { id: otaId }, data: { status, progress, errorCode: status === 'FAILED' ? errorCode ?? null : null, startedAt: ota.startedAt ?? new Date(), completedAt: status === 'SUCCEEDED' || status === 'FAILED' ? ota.completedAt ?? new Date() : null } });
      if (status === 'SUCCEEDED') await transaction.device.update({ where: { id: deviceId }, data: { firmwareVersion: ota.firmware.version } });
      return updated;
    });
  }
}

export default new DeviceService();

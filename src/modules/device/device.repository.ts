import prisma from '@/config/prisma.js';

class DeviceRepository {
  get device() { return prisma.msDevice; }
  get pairingSession() { return prisma.trDevicePairingSession; }
  get credential() { return prisma.trDeviceCredential; }
  get telemetry() { return prisma.trDeviceTelemetry; }
  get emotionObservation() { return prisma.trDeviceEmotionObservation; }
  get checkIn() { return prisma.trDeviceCheckIn; }
  get command() { return prisma.trDeviceCommand; }
  get firmware() { return prisma.msFirmwareRelease; }
  get ota() { return prisma.trDeviceOtaDeployment; }
  get consent() { return prisma.trUserConsent; }
  get consentDocument() { return prisma.msConsentDocument; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) { return prisma.$transaction(callback); }
}

export default new DeviceRepository();

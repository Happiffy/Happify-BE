import prisma from '@/config/prisma.js';

class DeviceRepository {
  get device() { return prisma.device; }
  get pairingSession() { return prisma.devicePairingSession; }
  get credential() { return prisma.deviceCredential; }
  get telemetry() { return prisma.deviceTelemetry; }
  get emotionObservation() { return prisma.deviceEmotionObservation; }
  get checkIn() { return prisma.deviceCheckIn; }
  get command() { return prisma.deviceCommand; }
  get firmware() { return prisma.firmwareRelease; }
  get ota() { return prisma.deviceOtaDeployment; }
  get consent() { return prisma.userConsent; }
  get consentDocument() { return prisma.consentDocument; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) { return prisma.$transaction(callback); }
}

export default new DeviceRepository();

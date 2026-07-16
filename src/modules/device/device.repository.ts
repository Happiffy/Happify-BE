import prisma from '@/config/prisma.js';

class DeviceRepository {
  get device() { return prisma.device; }
  get pairingSession() { return prisma.devicePairingSession; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export default new DeviceRepository();

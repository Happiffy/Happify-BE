import prisma from '@/config/prisma.js';
class VoiceRepository {
  get voiceTurn() { return prisma.voiceTurn; }
  get userConsent() { return prisma.userConsent; }
  get consentDocument() { return prisma.consentDocument; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) { return prisma.$transaction(callback); }
}
export default new VoiceRepository();

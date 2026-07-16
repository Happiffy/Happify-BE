import prisma from '@/config/prisma.js';
class VoiceRepository {
  get voiceTurn() { return prisma.trVoiceTurn; }
  get userConsent() { return prisma.trUserConsent; }
  get consentDocument() { return prisma.msConsentDocument; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) { return prisma.$transaction(callback); }
}
export default new VoiceRepository();

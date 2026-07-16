import prisma from '@/config/prisma.js';

class HeatmapRepository {
  get contribution() { return prisma.trHeatmapContribution; }
  get consent() { return prisma.trUserConsent; }
  get consentDocument() { return prisma.msConsentDocument; }
}

export default new HeatmapRepository();

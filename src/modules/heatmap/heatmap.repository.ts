import prisma from '@/config/prisma.js';

class HeatmapRepository {
  get contribution() { return prisma.heatmapContribution; }
  get consent() { return prisma.userConsent; }
  get consentDocument() { return prisma.consentDocument; }
}

export default new HeatmapRepository();

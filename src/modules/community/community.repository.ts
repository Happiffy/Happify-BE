import prisma from '@/config/prisma.js';

class CommunityRepository {
  get communityPost() { return prisma.communityPost; }
  get communitySupport() { return prisma.communitySupport; }
  get communityComment() { return prisma.communityComment; }
  get communityReport() { return prisma.communityReport; }
  get moderationAudit() { return prisma.communityModerationAudit; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export default new CommunityRepository();

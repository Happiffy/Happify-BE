import prisma from '@/config/prisma.js';

class CommunityRepository {
  get communityPost() { return prisma.trCommunityPost; }
  get communitySupport() { return prisma.trCommunitySupport; }
  get communityComment() { return prisma.trCommunityComment; }
  get communityReport() { return prisma.trCommunityReport; }
  get moderationAudit() { return prisma.trCommunityModerationAudit; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export default new CommunityRepository();

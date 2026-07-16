import prisma from '@/config/prisma.js';

class CommunityRepository {
  get communityPost() { return prisma.communityPost; }
  get communitySupport() { return prisma.communitySupport; }
  get communityComment() { return prisma.communityComment; }
}

export default new CommunityRepository();

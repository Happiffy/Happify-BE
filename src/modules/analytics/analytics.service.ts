import prisma from '@/config/prisma.js';

class AnalyticsService {
  async getDashboard(userId: string) {
    const [profile, moods, journals, communityPosts, referrals, heatmapPoints, riskGroups] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { psychologistApplication: true } }),
      prisma.mood.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 14 }),
      prisma.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.communityPost.count({ where: { userId } }),
      prisma.referral.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.moodGeoPoint.count(),
      prisma.journalEntry.groupBy({ by: ['riskLevel'], where: { userId }, _count: { riskLevel: true } }),
    ]);

    return {
      profile,
      totals: {
        moods: moods.length,
        journals: journals.length,
        communityPosts,
        referrals: referrals.length,
        heatmapPoints,
      },
      latestMood: moods[0] ?? null,
      moodTrend: moods.toReversed().map((mood) => ({ state: mood.state, intensity: mood.intensity, createdAt: mood.createdAt })),
      recentJournals: journals.map((journal) => ({ id: journal.id, title: journal.title, content: journal.content, imageUrl: journal.imageUrl, detectedMood: journal.detectedMood, aiReflection: journal.aiReflection, riskLevel: journal.riskLevel, createdAt: journal.createdAt })),
      referrals: referrals.map((referral) => ({ id: referral.id, riskLevel: referral.riskLevel, reason: referral.reason, status: referral.status, createdAt: referral.createdAt })),
      riskSummary: riskGroups.map((item) => ({ riskLevel: item.riskLevel, count: item._count.riskLevel })),
    };
  }
}

export default new AnalyticsService();

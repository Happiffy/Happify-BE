import heatmapRepository from '@/modules/heatmap/heatmap.repository.js';
import type { HeatmapContributionDTO } from '@/modules/heatmap/heatmap.validation.js';

const minimumCohort = Math.max(3, Number(process.env.HEATMAP_K_ANONYMITY ?? 5));

function utcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

class HeatmapService {
  async contribute(userId: string, body: HeatmapContributionDTO) {
    const latestDocument = await heatmapRepository.consentDocument.findFirst({ where: { scope: 'HEATMAP_CONTRIBUTION', isActive: true, effectiveAt: { lte: new Date() } }, orderBy: { version: 'desc' }, select: { id: true } });
    const consent = latestDocument ? await heatmapRepository.consent.findFirst({ where: { userId, documentId: latestDocument.id, status: 'ACCEPTED' }, select: { id: true } }) : null;
    if (!consent) throw new Error('HEATMAP_CONSENT_REQUIRED');
    const contribution = await heatmapRepository.contribution.upsert({
      where: { userId_bucketDate: { userId, bucketDate: utcDay() } },
      update: { regionKey: body.regionKey, mood: body.mood },
      create: { userId, regionKey: body.regionKey, mood: body.mood, bucketDate: utcDay() },
      select: { id: true, regionKey: true, mood: true, bucketDate: true, updatedAt: true },
    });
    return contribution;
  }

  async list(days: number) {
    const since = utcDay(new Date(Date.now() - (days - 1) * 86400000));
    const groups = await heatmapRepository.contribution.groupBy({
      by: ['regionKey', 'mood'],
      where: { bucketDate: { gte: since } },
      _count: { _all: true },
    });
    const regions = new Map<string, { count: number; moods: Record<string, number> }>();
    for (const group of groups) {
      const region = regions.get(group.regionKey) ?? { count: 0, moods: {} };
      region.count += group._count._all;
      region.moods[group.mood] = group._count._all;
      regions.set(group.regionKey, region);
    }
    return [...regions.entries()]
      .filter(([, value]) => value.count >= minimumCohort)
      .map(([regionKey, value]) => ({ regionKey, count: value.count, moods: value.moods }))
      .sort((a, b) => b.count - a.count);
  }
}

export default new HeatmapService();

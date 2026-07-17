import heatmapRepository from '@/modules/heatmap/heatmap.repository.js';
import type { HeatmapContributionDTO, HeatmapQuery } from '@/modules/heatmap/heatmap.validation.js';

const minimumCohort = Math.max(3, Number(process.env.HEATMAP_K_ANONYMITY ?? 5));

function utcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function gridMetadata(regionKey: string) {
  const match = /^G([NS])(\d+)_([EW])(\d+)$/.exec(regionKey);
  if (!match) return null;
  const latitude = Number(match[2]) / 10 * (match[1] === 'S' ? -1 : 1);
  const longitude = Number(match[4]) / 10 * (match[3] === 'W' ? -1 : 1);
  const size = 0.1;
  return { latitude, longitude, bounds: { south: latitude, west: longitude, north: latitude + size, east: longitude + size } };
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

  async list(query: HeatmapQuery) {
    const startDate = query.startDate ? utcDay(query.startDate) : utcDay(new Date(Date.now() - ((query.days ?? 7) - 1) * 86400000));
    const endDate = query.endDate ? utcDay(query.endDate) : utcDay();
    const contributions = await heatmapRepository.contribution.findMany({
      where: { bucketDate: { gte: startDate, lte: endDate } },
      select: { userId: true, regionKey: true, mood: true },
    });
    const regions = new Map<string, { users: Set<string>; moods: Record<string, Set<string>> }>();
    for (const contribution of contributions) {
      const region = regions.get(contribution.regionKey) ?? { users: new Set<string>(), moods: {} };
      region.users.add(contribution.userId);
      const moodUsers = region.moods[contribution.mood] ?? new Set<string>();
      moodUsers.add(contribution.userId);
      region.moods[contribution.mood] = moodUsers;
      regions.set(contribution.regionKey, region);
    }
    return [...regions.entries()]
      .filter(([, value]) => value.users.size >= minimumCohort)
       .flatMap(([regionKey, value]) => {
         const grid = gridMetadata(regionKey);
         if (!grid) return [];
         return [{
           regionKey,
           ...grid,
           count: value.users.size,
           moods: Object.fromEntries(Object.entries(value.moods).map(([mood, users]) => [mood, users.size])),
         }];
       })
      .sort((a, b) => b.count - a.count);
  }
}

export default new HeatmapService();

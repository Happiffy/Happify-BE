import heatmapRepository from '@/modules/heatmap/heatmap.repository.js';

class HeatmapService {
  async list() {
    return heatmapRepository.moodGeoPoint.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  }
}

export default new HeatmapService();

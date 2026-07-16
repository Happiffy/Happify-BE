import prisma from '@/config/prisma.js';

class HeatmapRepository {
  get moodGeoPoint() { return prisma.moodGeoPoint; }
}

export default new HeatmapRepository();

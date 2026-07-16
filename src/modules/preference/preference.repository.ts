import prisma from '@/config/prisma.js';

class PreferenceRepository {
  get userPreference() { return prisma.msUserPreference; }
}

export default new PreferenceRepository();

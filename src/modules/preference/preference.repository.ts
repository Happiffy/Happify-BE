import prisma from '@/config/prisma.js';

class PreferenceRepository {
  get userPreference() { return prisma.userPreference; }
}

export default new PreferenceRepository();

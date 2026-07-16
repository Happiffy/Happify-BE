import prisma from '@/config/prisma.js';

class ProfileRepository {
  get user() { return prisma.user; }
  get psychologistApplication() { return prisma.psychologistApplication; }
}

export default new ProfileRepository();

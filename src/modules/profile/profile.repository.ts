import prisma from '@/config/prisma.js';

class ProfileRepository {
  get user() { return prisma.user; }
  get psychologistApplication() { return prisma.psychologistApplication; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export default new ProfileRepository();

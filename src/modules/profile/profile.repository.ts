import prisma from '@/config/prisma.js';

class ProfileRepository {
  get user() { return prisma.msUser; }
  get psychologistApplication() { return prisma.trPsychologistApplication; }
  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export default new ProfileRepository();

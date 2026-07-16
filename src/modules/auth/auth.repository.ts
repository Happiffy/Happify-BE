import prisma from '@/config/prisma.js';

class AuthRepository {
  get user() { return prisma.msUser; }
  get role() { return prisma.msRole; }

  transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    return prisma.$transaction(callback);
  }
}

export default new AuthRepository();

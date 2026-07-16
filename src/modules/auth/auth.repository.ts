import prisma from '@/config/prisma.js';

class AuthRepository {
  get user() { return prisma.user; }
}

export default new AuthRepository();

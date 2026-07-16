import prisma from '@/config/prisma.js';

class AuthRepository {
  get user() { return prisma.msUser; }
}

export default new AuthRepository();

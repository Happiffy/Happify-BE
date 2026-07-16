import prisma from '@/config/prisma.js';

class MoodRepository {
  get mood() { return prisma.mood; }
}

export default new MoodRepository();

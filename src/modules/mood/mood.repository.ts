import prisma from '@/config/prisma.js';

class MoodRepository {
  get mood() { return prisma.trMoodEntry; }
}

export default new MoodRepository();

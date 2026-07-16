import prisma from '@/config/prisma.js';

class JournalRepository {
  get journalEntry() { return prisma.journalEntry; }
  get referral() { return prisma.referral; }
}

export default new JournalRepository();

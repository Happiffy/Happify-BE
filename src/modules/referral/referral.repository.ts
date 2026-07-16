import prisma from '@/config/prisma.js';

class ReferralRepository {
  get referral() { return prisma.referral; }
  get careChatSession() { return prisma.careChatSession; }
  get careChatMessage() { return prisma.careChatMessage; }
  get user() { return prisma.user; }
  get mood() { return prisma.mood; }
  get journalEntry() { return prisma.journalEntry; }
  get userPreference() { return prisma.userPreference; }
}

export default new ReferralRepository();

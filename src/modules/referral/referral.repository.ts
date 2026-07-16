import prisma from '@/config/prisma.js';

class ReferralRepository {
  get referral() { return prisma.trReferral; }
  get careChatSession() { return prisma.trCareChatSession; }
  get careChatMessage() { return prisma.trCareChatMessage; }
  get user() { return prisma.msUser; }
  get mood() { return prisma.trMoodEntry; }
  get journalEntry() { return prisma.trJournalEntry; }
  get userPreference() { return prisma.msUserPreference; }
}

export default new ReferralRepository();

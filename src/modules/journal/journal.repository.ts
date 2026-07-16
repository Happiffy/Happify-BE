import prisma from '@/config/prisma.js';

class JournalRepository {
  get journalEntry() { return prisma.journalEntry; }
  get referral() { return prisma.referral; }
  get consent() { return prisma.userConsent; }
  get consentDocument() { return prisma.consentDocument; }
}

export default new JournalRepository();

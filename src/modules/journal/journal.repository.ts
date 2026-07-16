import prisma from '@/config/prisma.js';

class JournalRepository {
  get journalEntry() { return prisma.trJournalEntry; }
  get referral() { return prisma.trReferral; }
  get consent() { return prisma.trUserConsent; }
  get consentDocument() { return prisma.msConsentDocument; }
}

export default new JournalRepository();

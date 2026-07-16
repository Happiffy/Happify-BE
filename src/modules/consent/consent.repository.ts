import prisma from '@/config/prisma.js';

class ConsentRepository {
  get document() { return prisma.msConsentDocument; }
  get consent() { return prisma.trUserConsent; }
}
export default new ConsentRepository();

import prisma from '@/config/prisma.js';

class ConsentRepository {
  get document() { return prisma.consentDocument; }
  get consent() { return prisma.userConsent; }
}
export default new ConsentRepository();

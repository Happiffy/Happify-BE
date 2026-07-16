import prisma from '@/config/prisma.js';
class ProviderRepository { get provider() { return prisma.provider; } }
export default new ProviderRepository();

import prisma from '@/config/prisma.js';
class ProviderRepository { get provider() { return prisma.msProvider; } }
export default new ProviderRepository();

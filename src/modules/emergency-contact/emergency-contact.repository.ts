import prisma from '@/config/prisma.js';
class EmergencyContactRepository { get contact() { return prisma.emergencyContact; } transaction<T>(callback: (transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) { return prisma.$transaction(callback); } }
export default new EmergencyContactRepository();

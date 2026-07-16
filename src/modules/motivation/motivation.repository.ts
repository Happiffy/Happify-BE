import prisma from '@/config/prisma.js';
class MotivationRepository { get motivation() { return prisma.msDailyMotivation; } }
export default new MotivationRepository();

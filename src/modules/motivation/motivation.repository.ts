import prisma from '@/config/prisma.js';
class MotivationRepository { get motivation() { return prisma.dailyMotivation; } }
export default new MotivationRepository();

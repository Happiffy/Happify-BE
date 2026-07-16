import prisma from '@/config/prisma.js';
class MindfulnessRepository { get activity() { return prisma.mindfulnessActivity; } get progress() { return prisma.mindfulnessProgress; } }
export default new MindfulnessRepository();

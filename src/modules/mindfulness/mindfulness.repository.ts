import prisma from '@/config/prisma.js';
class MindfulnessRepository { get activity() { return prisma.msMindfulnessActivity; } get progress() { return prisma.trMindfulnessProgress; } }
export default new MindfulnessRepository();

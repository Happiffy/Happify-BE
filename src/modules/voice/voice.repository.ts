import prisma from '@/config/prisma.js';

class VoiceRepository {
  get voiceTurn() { return prisma.voiceTurn; }
  get userPreference() { return prisma.userPreference; }
}

export default new VoiceRepository();

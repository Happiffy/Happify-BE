import moodRepository from '@/modules/mood/mood.repository.js';
import type { CreateMoodDTO, MoodListQuery } from '@/modules/mood/mood.validation.js';

class MoodService {
  async list(userId: string, query: MoodListQuery) {
    const startDate = query.startDate ? new Date(Date.UTC(query.startDate.getUTCFullYear(), query.startDate.getUTCMonth(), query.startDate.getUTCDate())) : undefined;
    const endDate = query.endDate ? new Date(Date.UTC(query.endDate.getUTCFullYear(), query.endDate.getUTCMonth(), query.endDate.getUTCDate() + 1)) : undefined;
    return moodRepository.mood.findMany({ where: { userId, ...(startDate && endDate ? { createdAt: { gte: startDate, lt: endDate } } : {}) }, orderBy: { createdAt: 'desc' }, take: query.limit });
  }

  async create(userId: string, body: CreateMoodDTO) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const existingMood = await moodRepository.mood.findFirst({ where: { userId, createdAt: { gte: startOfDay, lt: endOfDay } }, orderBy: { createdAt: 'desc' } });
    if (existingMood) return moodRepository.mood.update({ where: { id: existingMood.id }, data: { state: body.state, intensity: body.intensity, triggers: body.triggers, note: body.note ?? null } });
    return moodRepository.mood.create({ data: { userId, state: body.state, intensity: body.intensity, triggers: body.triggers, note: body.note ?? null } });
  }
}

export default new MoodService();

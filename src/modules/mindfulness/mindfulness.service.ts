import mindfulnessRepository from '@/modules/mindfulness/mindfulness.repository.js';
import type { MindfulnessProgressDTO } from '@/modules/mindfulness/mindfulness.validation.js';
class MindfulnessService {
  list(userId: string, locale: string, type?: 'BREATHING' | 'MEDITATION' | 'GROUNDING') {
    return mindfulnessRepository.activity.findMany({ where: { isPublished: true, locale, ...(type ? { type } : {}) }, orderBy: [{ type: 'asc' }, { durationSeconds: 'asc' }], include: { progress: { where: { userId } } } });
  }
  async updateProgress(userId: string, body: MindfulnessProgressDTO) {
    const activity = await mindfulnessRepository.activity.findFirst({ where: { id: body.activityId, isPublished: true }, select: { id: true, durationSeconds: true } });
    if (!activity) throw new Error('NOT_FOUND');
    const completed = body.completed || body.progressSeconds >= activity.durationSeconds;
    return mindfulnessRepository.progress.upsert({
      where: { userId_activityId: { userId, activityId: body.activityId } },
      update: { progressSeconds: Math.min(body.progressSeconds, activity.durationSeconds), status: completed ? 'COMPLETED' : 'STARTED', completedAt: completed ? new Date() : null },
      create: { userId, activityId: body.activityId, progressSeconds: Math.min(body.progressSeconds, activity.durationSeconds), status: completed ? 'COMPLETED' : 'STARTED', completedAt: completed ? new Date() : null },
    });
  }
}
export default new MindfulnessService();

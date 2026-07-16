import referralRepository from '@/modules/referral/referral.repository.js';
import type { CreateCareChatMessageDTO, CreateReferralDTO, ReviewReferralDTO } from '@/modules/referral/referral.validation.js';
import { broadcast } from '@/realtime.js';
import { completeText } from '@/utils/ai.util.js';

class ReferralService {
  async list(userId: string | undefined, page: number, limit: number) {
    return referralRepository.referral.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true, preference: true } },
        psychologist: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true } },
        chatSession: { select: { id: true, updatedAt: true } },
      },
    });
  }

  async review(id: string, body: ReviewReferralDTO) {
    const referral = await referralRepository.referral.update({
      where: { id },
      data: {
        status: body.status,
        psychologistId: body.psychologistId,
        reviewerComment: body.reviewerComment ?? null,
        reviewedAt: new Date(),
      },
    });

    if (body.status === 'ACCEPTED') {
      await referralRepository.careChatSession.upsert({
        where: { referralId: id },
        update: { psychologistId: body.psychologistId, status: 'OPEN', closedAt: null },
        create: { referralId: id, userId: referral.userId, psychologistId: body.psychologistId },
      });
    }

    const reviewedReferral = await referralRepository.referral.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true, preference: true } },
        psychologist: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true } },
        chatSession: { select: { id: true, updatedAt: true } },
      },
    });
    broadcast('care', { type: 'referral:reviewed', referral: reviewedReferral });
    broadcast(`user:${referral.userId}:care`, { type: 'referral:reviewed', referral: reviewedReferral });
    return reviewedReferral;
  }

  async create(body: CreateReferralDTO) {
    const backgroundSnapshot = await this.getUserBackground(body.userId);

    const referral = await referralRepository.referral.create({
      data: {
        userId: body.userId,
        riskLevel: body.riskLevel,
        reason: body.reason,
        requestComment: body.requestComment ?? null,
        backgroundSnapshot,
        providerName: body.providerName ?? null,
        providerType: body.providerType ?? null,
        contactUrl: body.contactUrl ?? null,
      },
    });
    broadcast('care', { type: 'referral:created', referral });
    return referral;
  }

  async listChatSessions(userId: string, page: number, limit: number) {
    return referralRepository.careChatSession.findMany({
      where: { OR: [{ userId }, { psychologistId: userId }] },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true } },
        psychologist: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true } },
        referral: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 30, include: { sender: { select: { id: true, displayName: true, avatarUrl: true, role: true } } } },
      },
    });
  }

  async getChatSession(id: string) {
    return referralRepository.careChatSession.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true } },
        psychologist: { select: { id: true, displayName: true, email: true, avatarUrl: true, bio: true } },
        referral: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, displayName: true, avatarUrl: true, role: true } } } },
      },
    });
  }

  async updateChatSessionStatus(sessionId: string, status: 'OPEN' | 'CLOSED') {
    const summary = status === 'CLOSED' ? await this.generateSessionSummary(sessionId) : null;
    const session = await referralRepository.careChatSession.update({
      where: { id: sessionId },
      data: { status, closedAt: status === 'CLOSED' ? new Date() : null, ...(summary ? { summary } : {}) },
    });
    broadcast(`care-chat:${sessionId}`, { type: 'care-chat:session', session });
    return session;
  }

  private async generateSessionSummary(sessionId: string) {
    const messages = await referralRepository.careChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { displayName: true, role: true } } },
    });
    if (messages.length === 0) return 'Session closed without any messages.';

    const transcript = messages.map((message) => `${message.sender.role === 'PSYCHOLOGIST' ? 'Psychologist' : 'User'}: ${message.content || '[image]'}`).join('\n').slice(0, 6000);

    const summary = await completeText([
      { role: 'system', content: 'Summarize this mental health support chat in 2-3 short sentences. Focus on the main topic, how the user felt, and any advice given. Reply in the same language as the chat.' },
      { role: 'user', content: transcript },
    ], 160);
    if (summary) return summary;

    const firstUserMessage = messages.find((message) => message.sender.role !== 'PSYCHOLOGIST')?.content ?? '';
    return `Talked about: ${firstUserMessage.slice(0, 140) || 'care support'}. ${messages.length} messages exchanged.`;
  }

  async createChatMessage(sessionId: string, body: CreateCareChatMessageDTO) {
    const message = await referralRepository.careChatMessage.create({
      data: { sessionId, senderId: body.senderId, content: body.content, imageUrl: body.imageUrl ?? null },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true, role: true } } },
    });
    const session = await referralRepository.careChatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    broadcast(`care-chat:${sessionId}`, { type: 'care-chat:message', message });
    broadcast(`user:${session.userId}:care`, { type: 'care-chat:message', message });
    broadcast(`user:${session.psychologistId}:care`, { type: 'care-chat:message', message });
    return message;
  }

  private async getUserBackground(userId: string) {
    const [user, moods, journals, preference] = await Promise.all([
      referralRepository.user.findUnique({ where: { id: userId }, select: { displayName: true, email: true, bio: true, createdAt: true } }),
      referralRepository.mood.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5, select: { state: true, intensity: true, triggers: true, note: true, createdAt: true } }),
      referralRepository.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5, select: { title: true, riskLevel: true, detectedMood: true, aiReflection: true, createdAt: true } }),
      referralRepository.userPreference.findUnique({ where: { userId } }),
    ]);

    return { user, preference, recentMoods: moods, recentJournals: journals };
  }
}

export default new ReferralService();

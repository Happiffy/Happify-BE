import voiceRepository from '@/modules/voice/voice.repository.js';
import { fetchVoiceAudio, processVoiceAudio } from '@/modules/voice/voice.client.js';
import { voiceUpstreamSchema } from '@/modules/voice/voice.validation.js';
import notificationService from '@/modules/notification/notification.service.js';

const audioTtlMs = Number(process.env.VOICE_AUDIO_TTL_SECONDS ?? 900) * 1000;
const allowedTypes = new Set(['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']);
const maxBytes = Number(process.env.VOICE_MAX_AUDIO_BYTES ?? 6291456);

class VoiceService {
  async process(userId: string, audio: Buffer, contentType: string, language: 'id' | 'en', idempotencyKey?: string, sessionId?: string) {
    if (!allowedTypes.has(contentType)) throw new Error('UNSUPPORTED_AUDIO_TYPE');
    if (audio.length < 1000) throw new Error('INVALID_AUDIO');
    if (audio.length > maxBytes) throw new Error('AUDIO_TOO_LARGE');
    if (idempotencyKey) {
      const existing = await voiceRepository.voiceTurn.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, include: { referral: true } });
      if (existing) return this.response(existing);
    }
    const latestDocument = await voiceRepository.consentDocument.findFirst({ where: { scope: 'VOICE_PROCESSING', isActive: true, effectiveAt: { lte: new Date() } }, orderBy: { version: 'desc' }, select: { id: true } });
    const consent = latestDocument ? await voiceRepository.userConsent.findFirst({ where: { userId, documentId: latestDocument.id, status: 'ACCEPTED' }, select: { id: true } }) : null;
    if (!consent) throw new Error('AI_CONSENT_REQUIRED');
    const result = voiceUpstreamSchema.safeParse(await processVoiceAudio(audio, contentType, language));
    if (!result.success) throw new Error('VOICE_UPSTREAM_INVALID');
    const { upstreamAudioPath, riskLevel, transcript, responseText, detectedMood, emotionConfidence, upstreamRequestId } = result.data;
    const turn = await voiceRepository.transaction(async (transaction) => {
      const referral = riskLevel === 'HIGH' || riskLevel === 'CRISIS'
        ? await transaction.trReferral.create({
            data: {
              userId,
              riskLevel,
              reason: `Voice turn flagged ${riskLevel.toLowerCase()} risk`,
              requestComment: `Professional review requested after ${riskLevel.toLowerCase()} risk was detected in a voice interaction.`,
              providerName: 'Happify Professional Care',
              providerType: 'Verified psychologist',
            },
          })
        : null;

      return transaction.trVoiceTurn.create({
        data: { userId, sessionId: sessionId ?? null, idempotencyKey: idempotencyKey ?? null, language, transcript, responseText, detectedMood, emotionConfidence, riskLevel, upstreamRequestId, upstreamAudioPath, audioExpiresAt: upstreamAudioPath ? new Date(Date.now() + audioTtlMs) : null, referralId: referral?.id ?? null },
        include: { referral: true },
      });
    });
    if (turn.referral) void notificationService.sendToRole('PSYCHOLOGIST', { title: 'Urgent voice escalation', body: 'A voice interaction needs professional review.', data: { type: 'referral.created', referralId: turn.referral.id, riskLevel: turn.referral.riskLevel, target: 'care' } }).catch(() => undefined);
    return this.response(turn);
  }

  async list(userId: string, limit: number) {
    const turns = await voiceRepository.voiceTurn.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit, include: { referral: true } });
    return turns.map((turn) => this.response(turn));
  }

  async getAudio(turnId: string, userId: string) {
    const turn = await voiceRepository.voiceTurn.findFirst({ where: { id: turnId, userId }, select: { upstreamAudioPath: true, audioExpiresAt: true } });
    if (!turn?.upstreamAudioPath || !turn.audioExpiresAt || turn.audioExpiresAt <= new Date()) throw new Error('VOICE_AUDIO_NOT_FOUND');
    return fetchVoiceAudio(turn.upstreamAudioPath);
  }

  private response(turn: { id: string; sessionId: string | null; transcript: string | null; responseText: string | null; detectedMood: string | null; emotionConfidence: number | null; riskLevel: string | null; upstreamAudioPath: string | null; audioExpiresAt: Date | null; createdAt: Date; referral: unknown }) {
    return { id: turn.id, sessionId: turn.sessionId, transcript: turn.transcript, responseText: turn.responseText, detectedMood: turn.detectedMood, emotionConfidence: turn.emotionConfidence, riskLevel: turn.riskLevel, audioUrl: turn.upstreamAudioPath ? `/voice/turns/${turn.id}/audio` : null, audioExpiresAt: turn.audioExpiresAt, createdAt: turn.createdAt, referral: turn.referral };
  }
}
export default new VoiceService();

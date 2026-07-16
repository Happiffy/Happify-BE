import voiceRepository from '@/modules/voice/voice.repository.js';
import { fetchVoiceAudio, processVoiceAudio } from '@/modules/voice/voice.client.js';

const audioTtlMs = Number(process.env.VOICE_AUDIO_TTL_SECONDS ?? 900) * 1000;
const allowedTypes = new Set(['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']);
const maxBytes = Number(process.env.VOICE_MAX_AUDIO_BYTES ?? 6291456);

class VoiceService {
  async process(userId: string, audio: Buffer, contentType: string, language: 'id' | 'en') {
    if (!allowedTypes.has(contentType)) throw new Error('UNSUPPORTED_AUDIO_TYPE');
    if (audio.length < 1000) throw new Error('INVALID_AUDIO');
    if (audio.length > maxBytes) throw new Error('AUDIO_TOO_LARGE');
    const preference = await voiceRepository.userPreference.findUnique({ where: { userId }, select: { consentToAi: true } });
    if (!preference?.consentToAi) throw new Error('AI_CONSENT_REQUIRED');
    const result = await processVoiceAudio(audio, contentType, language);
    const upstreamAudioPath = typeof result.audio_url === 'string' ? result.audio_url : typeof result.audioUrl === 'string' ? result.audioUrl : null;
    const audioExpiresAt = upstreamAudioPath ? new Date(Date.now() + audioTtlMs) : null;
    const turn = await voiceRepository.voiceTurn.create({ data: { userId, upstreamAudioPath, audioExpiresAt }, select: { id: true, audioExpiresAt: true } });
    return { ...result, audio_url: undefined, audioUrl: upstreamAudioPath ? `/voice/turns/${turn.id}/audio` : null, audioExpiresAt: turn.audioExpiresAt };
  }

  async getAudio(turnId: string, userId: string) {
    const turn = await voiceRepository.voiceTurn.findFirst({ where: { id: turnId, userId }, select: { upstreamAudioPath: true, audioExpiresAt: true } });
    if (!turn?.upstreamAudioPath || !turn.audioExpiresAt || turn.audioExpiresAt <= new Date()) throw new Error('VOICE_AUDIO_NOT_FOUND');
    return fetchVoiceAudio(turn.upstreamAudioPath);
  }
}

export default new VoiceService();

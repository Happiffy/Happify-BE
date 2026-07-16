import { z } from 'zod';

const textSchema = z.string().trim().min(1).max(10000);
const requestIdSchema = z.string().trim().min(1).max(200);
const audioPathSchema = z.string().regex(/^\/api\/audio\/tts_[a-f0-9]{12}\.mp3$/);
const canonicalRiskSchema = z.enum(['low', 'medium', 'high', 'crisis']);
const riskSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRISIS']);
const canonicalMoodSchema = z.enum(['calm', 'happy', 'neutral', 'sad', 'anxious', 'distressed']);
const moodSchema = z.enum(['CALM', 'HAPPY', 'NEUTRAL', 'SAD', 'ANXIOUS', 'DISTRESSED']);

const canonicalVoiceUpstreamSchema = z.object({
  contract_version: z.literal('1.0.0'),
  request_id: requestIdSchema,
  transcript: z.object({ text: textSchema }),
  response: z.object({
    text: textSchema,
    audio_url: audioPathSchema.nullable(),
  }),
  emotion: z.object({
    state: canonicalMoodSchema,
    confidence: z.number().min(0).max(1),
  }),
  risk_policy: z.object({ severity: canonicalRiskSchema }),
  audio_url: audioPathSchema.nullable().optional(),
  audioUrl: audioPathSchema.nullable().optional(),
}).transform((value) => ({
  transcript: value.transcript.text,
  responseText: value.response.text,
  riskLevel: value.risk_policy.severity.toUpperCase() as z.infer<typeof riskSchema>,
  detectedMood: value.emotion.state.toUpperCase() as z.infer<typeof moodSchema>,
  emotionConfidence: value.emotion.confidence,
  upstreamAudioPath: value.response.audio_url ?? value.audio_url ?? value.audioUrl ?? null,
  upstreamRequestId: value.request_id,
}));

const legacyVoiceUpstreamSchema = z.object({
  transcript: textSchema.nullable().optional(),
  response_text: textSchema.nullable().optional(),
  responseText: textSchema.nullable().optional(),
  risk_level: riskSchema.optional(),
  riskLevel: riskSchema.optional(),
  audio_url: audioPathSchema.nullable().optional(),
  audioUrl: audioPathSchema.nullable().optional(),
  request_id: requestIdSchema.optional(),
  requestId: requestIdSchema.optional(),
}).strict().refine(
  (value) => value.transcript != null || value.response_text != null || value.responseText != null,
  { message: 'Upstream voice payload has no usable content' },
).transform((value) => ({
  transcript: value.transcript ?? null,
  responseText: value.response_text ?? value.responseText ?? null,
  riskLevel: value.risk_level ?? value.riskLevel ?? null,
  detectedMood: null,
  emotionConfidence: null,
  upstreamAudioPath: value.audio_url ?? value.audioUrl ?? null,
  upstreamRequestId: value.request_id ?? value.requestId ?? null,
}));

export const voiceUpstreamSchema = z.union([
  canonicalVoiceUpstreamSchema,
  legacyVoiceUpstreamSchema,
]);
export type VoiceUpstreamDTO = z.infer<typeof voiceUpstreamSchema>;

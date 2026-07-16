import { z } from 'zod';
import { moodStateSchema, riskLevelSchema } from '@/modules/shared.validation.js';

const semanticVersionSchema = z.string().trim().min(1).max(60).regex(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
const idempotencyKeySchema = z.string().trim().min(8).max(200);
const observationProviderSchema = z.object({ provider: z.string().trim().min(1).max(100), model: z.string().trim().min(1).max(100), version: z.string().trim().min(1).max(100) }).strict();
const consentEvidenceSchema = z.object({ consentId: z.string().cuid(), version: z.number().int().positive() }).strict();
const retentionSchema = z.object({ policy: z.string().trim().min(1).max(100), retainUntil: z.coerce.date() }).strict();
const expressionProbabilitiesSchema = z.record(z.enum(['HAPPY', 'CALM', 'NEUTRAL', 'ANXIOUS', 'SAD', 'DISTRESSED']), z.number().finite().min(0).max(1)).refine((probabilities) => Object.keys(probabilities).length > 0, 'At least one expression probability is required').refine((probabilities) => Math.abs(Object.values(probabilities).reduce((sum, probability) => sum + probability, 0) - 1) <= 0.01, 'Expression probabilities must sum to 1');
const hapticSegmentSchema = z.object({ durationMs: z.number().int().min(50).max(10000), amplitude: z.number().finite().min(0).max(1), pauseAfterMs: z.number().int().min(0).max(10000).default(0) }).strict();
const hapticPayloadSchema = z.object({ therapyId: z.string().trim().min(1).max(100), pattern: z.array(hapticSegmentSchema).min(1).max(64), repeat: z.number().int().min(1).max(10).default(1), expiresAt: z.coerce.date().optional() }).strict().superRefine((payload, context) => {
  const duration = payload.pattern.reduce((total, segment) => total + segment.durationMs + segment.pauseAfterMs, 0) * payload.repeat;
  if (duration > 120000) context.addIssue({ code: 'custom', message: 'Haptic therapy pattern cannot exceed 120000ms' });
  if (!payload.pattern.some((segment) => segment.amplitude > 0)) context.addIssue({ code: 'custom', message: 'Haptic therapy pattern requires a non-zero amplitude' });
  if (payload.expiresAt && payload.expiresAt <= new Date()) context.addIssue({ code: 'custom', message: 'Haptic therapy command is already expired' });
});

export const deviceIdParamsSchema = z.object({ id: z.string().cuid() });
export const deviceCommandTypeSchema = z.enum(['HAPTIC_THERAPY', 'DISPLAY_MESSAGE', 'SET_CONFIGURATION', 'RESTART']);
export const startPairingSchema = z.object({ serialNumber: z.string().trim().toUpperCase().min(8).max(80).regex(/^[A-Z0-9-]+$/), claimSecret: z.string().min(16).max(256) }).strict();
export const updateDeviceSchema = z.object({ displayName: z.string().trim().min(1).max(60) }).strict();
export const telemetryBatchSchema = z.object({ items: z.array(z.object({ metric: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_.-]+$/), value: z.number().finite(), unit: z.string().trim().max(30).optional(), recordedAt: z.coerce.date(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional() }).strict()).min(1).max(100) }).strict();
export const heartbeatSchema = z.object({ firmwareVersion: semanticVersionSchema, hardwareRevision: z.string().trim().min(1).max(60), bootloaderVersion: semanticVersionSchema, protocolVersion: semanticVersionSchema, supportedCommandTypes: z.array(deviceCommandTypeSchema).max(20) }).strict();
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HAPTIC_THERAPY'), payload: hapticPayloadSchema, idempotencyKey: idempotencyKeySchema.optional() }).strict(),
  z.object({ type: z.literal('DISPLAY_MESSAGE'), payload: z.object({ text: z.string().trim().min(1).max(500), expiresAt: z.coerce.date().optional() }).strict(), idempotencyKey: idempotencyKeySchema.optional() }).strict(),
  z.object({ type: z.literal('SET_CONFIGURATION'), payload: z.object({ values: z.record(z.string().regex(/^[a-zA-Z0-9_.-]+$/), z.union([z.string(), z.number(), z.boolean()])) }).strict(), idempotencyKey: idempotencyKeySchema.optional() }).strict(),
  z.object({ type: z.literal('RESTART'), payload: z.object({ delaySeconds: z.number().int().min(0).max(300).default(0) }).strict(), idempotencyKey: idempotencyKeySchema.optional() }).strict(),
]);
export const commandStatusSchema = z.object({ status: z.enum(['ACKNOWLEDGED', 'COMPLETED', 'FAILED']), errorCode: z.string().trim().max(100).optional() }).strict();
export const emotionObservationSchema = z.object({ source: z.enum(['VOICE', 'CAMERA', 'FUSED']), inputSources: z.array(z.enum(['VOICE', 'CAMERA'])).min(1).max(2).optional(), state: moodStateSchema, confidence: z.number().finite().min(0).max(1), riskLevel: riskLevelSchema, facePresent: z.boolean().optional(), eyeContact: z.boolean().optional(), expressionProbabilities: expressionProbabilitiesSchema.optional(), observationProvider: observationProviderSchema, consentEvidence: consentEvidenceSchema, retention: retentionSchema, idempotencyKey: idempotencyKeySchema, observedAt: z.coerce.date() }).strict();
export const cameraObservationSchema = emotionObservationSchema.extend({ source: z.literal('CAMERA'), facePresent: z.boolean(), eyeContact: z.boolean(), expressionProbabilities: expressionProbabilitiesSchema }).strict();
export const moodSyncSchema = z.object({ kind: z.enum(['MOOD', 'CHECK_IN']), state: moodStateSchema, intensity: z.number().int().min(1).max(5).default(3), triggers: z.array(z.string().trim().min(1).max(80)).max(20).default([]), note: z.string().trim().max(1000).optional(), observedAt: z.coerce.date(), idempotencyKey: idempotencyKeySchema }).strict();
export const firmwareSchema = z.object({ model: z.string().trim().min(1).max(80), version: semanticVersionSchema, hardwareRevision: z.string().trim().min(1).max(60).optional(), minimumBootloaderVersion: semanticVersionSchema.optional(), protocolVersion: semanticVersionSchema, downloadUrl: z.string().url().max(2000), checksumSha256: z.string().regex(/^[a-f0-9]{64}$/), releaseNotes: z.string().max(5000).optional() }).strict();
export const firmwareStatusSchema = z.object({ status: z.enum(['ACTIVE', 'DEPRECATED']) }).strict();
export const otaSchema = z.object({ firmwareId: z.string().cuid() }).strict();
export const otaStatusSchema = z.object({ status: z.enum(['DOWNLOADING', 'INSTALLING', 'SUCCEEDED', 'FAILED']), progress: z.number().int().min(0).max(100), errorCode: z.string().trim().max(100).optional() }).strict().superRefine((body, context) => {
  if (body.status === 'SUCCEEDED' && body.progress !== 100) context.addIssue({ code: 'custom', message: 'Successful OTA progress must be 100' });
  if (body.status === 'FAILED' && !body.errorCode) context.addIssue({ code: 'custom', message: 'Failed OTA status requires errorCode' });
});

export type EmotionObservationDTO = z.infer<typeof emotionObservationSchema>;
export type HeartbeatDTO = z.infer<typeof heartbeatSchema>;
export type MoodSyncDTO = z.infer<typeof moodSyncSchema>;

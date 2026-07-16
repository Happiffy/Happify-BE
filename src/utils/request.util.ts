import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma/client.js';

const statusByMessage: Record<string, number> = {
  UNAUTHENTICATED: 401,
  DEVICE_UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  AI_CONSENT_REQUIRED: 403,
  DEVICE_OBSERVATION_CONSENT_REQUIRED: 403,
  HEATMAP_CONSENT_REQUIRED: 403,
  NOT_FOUND: 404,
  ACCOUNT_NOT_REGISTERED: 404,
  CONSENT_DOCUMENT_NOT_FOUND: 404,
  VOICE_AUDIO_NOT_FOUND: 404,
  CHAT_CLOSED: 409,
  DEVICE_ALREADY_PAIRED: 409,
  OTA_ALREADY_ACTIVE: 409,
  INVALID_COMMAND_TRANSITION: 409,
  INVALID_OTA_TRANSITION: 409,
  APPLICATION_ALREADY_REVIEWED: 409,
  PAIRING_INVALID: 400,
  INVALID_AUDIO: 400,
  INVALID_CONTENT: 400,
  REPORT_REQUIRED: 400,
  FIRMWARE_INCOMPATIBLE: 400,
  COMMAND_INCOMPATIBLE: 400,
  COMMAND_ERROR_CODE_REQUIRED: 400,
  INVALID_RETENTION: 400,
  INVALID_OBSERVATION_SOURCE: 400,
  AUDIO_TOO_LARGE: 413,
  IMAGE_TOO_LARGE: 413,
  UNSUPPORTED_AUDIO_TYPE: 415,
  VOICE_UPSTREAM_FAILED: 502,
  VOICE_UPSTREAM_INVALID: 502,
  VOICE_NOT_CONFIGURED: 503,
  S3_NOT_CONFIGURED: 503,
};

export function handleError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error('INTERNAL_ERROR');
}

export function getStatusCode(error: unknown): number {
  if (error instanceof ZodError) return 400;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 409;
    if (error.code === 'P2003') return 400;
    if (error.code === 'P2025') return 404;
  }
  return error instanceof Error ? statusByMessage[error.message] ?? 500 : 500;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join(', ');
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'CONFLICT';
    if (error.code === 'P2003') return 'INVALID_REFERENCE';
    if (error.code === 'P2025') return 'NOT_FOUND';
    return 'DATABASE_ERROR';
  }
  const message = handleError(error).message;
  return (statusByMessage[message] ?? 500) < 500 ? message : 'INTERNAL_ERROR';
}

import { ZodError } from 'zod';

export function handleError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error('Unknown error occurred');
}

export function getStatusCode(error: unknown): number {
  if (error instanceof ZodError) return 400;
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return 401;
  if (error instanceof Error && error.message === 'FORBIDDEN') return 403;
  if (error instanceof Error && (error.message === 'NOT_FOUND' || error.message === 'ACCOUNT_NOT_REGISTERED')) return 404;
  if (error instanceof Error && (error.message === 'CHAT_CLOSED' || error.message === 'DEVICE_ALREADY_PAIRED')) return 409;
  if (error instanceof Error && (error.message === 'PAIRING_INVALID' || error.message === 'INVALID_AUDIO')) return 400;
  if (error instanceof Error && error.message === 'AUDIO_TOO_LARGE') return 413;
  if (error instanceof Error && error.message === 'UNSUPPORTED_AUDIO_TYPE') return 415;
  if (error instanceof Error && error.message === 'AI_CONSENT_REQUIRED') return 403;
  if (error instanceof Error && error.message === 'VOICE_AUDIO_NOT_FOUND') return 404;
  if (error instanceof Error && (error.message === 'VOICE_UPSTREAM_FAILED' || error.message === 'VOICE_NOT_CONFIGURED')) return 502;
  return 500;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join(', ');
  return handleError(error).message;
}

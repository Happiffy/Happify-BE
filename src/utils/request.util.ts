import { ZodError } from 'zod';

export function handleError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error('Unknown error occurred');
}

export function getStatusCode(error: unknown): number {
  if (error instanceof ZodError) return 400;
  if (error instanceof Error && (error.message === 'NOT_FOUND' || error.message === 'ACCOUNT_NOT_REGISTERED')) return 404;
  return 500;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join(', ');
  return handleError(error).message;
}

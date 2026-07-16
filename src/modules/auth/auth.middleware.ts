import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@/generated/prisma/enums.js';
import { firebaseAuth } from '@/config/firebase.js';
import authRepository from '@/modules/auth/auth.repository.js';

export type AuthUser = {
  id: string;
  firebaseUid: string;
  role: UserRole;
};

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return response.status(401).json({ status: 'error', message: 'UNAUTHENTICATED' });

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(match[1], true);
    const user = await authRepository.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, firebaseUid: true, role: true },
    });
    if (!user) return response.status(401).json({ status: 'error', message: 'ACCOUNT_NOT_REGISTERED' });
    response.locals.authUser = user;
    return next();
  } catch {
    return response.status(401).json({ status: 'error', message: 'UNAUTHENTICATED' });
  }
}

export function requireRole(role: UserRole) {
  return (_request: Request, response: Response, next: NextFunction) => {
    const authUser = response.locals.authUser as AuthUser | undefined;
    if (!authUser) return response.status(401).json({ status: 'error', message: 'UNAUTHENTICATED' });
    if (authUser.role !== role) return response.status(403).json({ status: 'error', message: 'FORBIDDEN' });
    return next();
  };
}

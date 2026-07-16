import type { NextFunction, Request, Response } from 'express';
import { firebaseAuth } from '@/config/firebase.js';
import authRepository from '@/modules/auth/auth.repository.js';

export type UserRole = 'USER' | 'PSYCHOLOGIST' | 'MODERATOR' | 'ADMIN';

export type AuthUser = {
  id: string;
  firebaseUid: string;
  role: UserRole;
};

function isUserRole(role: string): role is UserRole {
  return ['USER', 'PSYCHOLOGIST', 'MODERATOR', 'ADMIN'].includes(role);
}

export async function authenticateToken(token: string): Promise<AuthUser> {
  const decodedToken = await firebaseAuth.verifyIdToken(token, true);
  const user = await authRepository.user.findUnique({
    where: { firebaseUid: decodedToken.uid },
    select: { id: true, firebaseUid: true, role: true },
  });
  if (!user || !isUserRole(user.role)) throw new Error('ACCOUNT_NOT_REGISTERED');
  return { ...user, role: user.role as UserRole };
}

export function getAuthUser(response: Response): AuthUser {
  const authUser = response.locals.authUser as AuthUser | undefined;
  if (!authUser) throw new Error('UNAUTHENTICATED');
  return authUser;
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match?.[1]) return response.status(401).json({ status: 'error', message: 'UNAUTHENTICATED' });

  try {
    response.locals.authUser = await authenticateToken(match[1]);
    return next();
  } catch {
    return response.status(401).json({ status: 'error', message: 'UNAUTHENTICATED' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (_request: Request, response: Response, next: NextFunction) => {
    const authUser = response.locals.authUser as AuthUser | undefined;
    if (!authUser) return response.status(401).json({ status: 'error', message: 'UNAUTHENTICATED' });
    if (!roles.includes(authUser.role)) return response.status(403).json({ status: 'error', message: 'FORBIDDEN' });
    return next();
  };
}

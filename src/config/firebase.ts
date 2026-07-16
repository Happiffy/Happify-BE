import { existsSync, readFileSync } from 'node:fs';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

function getFirebaseApp() {
  if (getApps().length) return getApp();

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    (serviceAccountPath && existsSync(serviceAccountPath) ? readFileSync(serviceAccountPath, 'utf8') : undefined);
  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing Firebase config. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID in BE-Happify/.env.');
  }

  return initializeApp({ projectId });
}

export const firebaseAdmin = getFirebaseApp();
export const firebaseAuth = getAuth(firebaseAdmin);
export const firebaseMessaging = getMessaging(firebaseAdmin);

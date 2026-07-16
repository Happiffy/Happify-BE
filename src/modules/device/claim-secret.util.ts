import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function getPepper() {
  const pepper = process.env.DEVICE_CLAIM_PEPPER;
  if (!pepper) throw new Error('DEVICE_CLAIM_PEPPER_MISSING');
  return pepper;
}

export function createClaimSecretDigest(secret: string) {
  return createHmac('sha256', getPepper()).update(secret).digest('hex');
}

export function verifyClaimSecret(secret: string, expectedDigest: string) {
  const actual = Buffer.from(createClaimSecretDigest(secret), 'hex');
  const expected = Buffer.from(expectedDigest, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createRuntimeCredentialDigest(token: string) {
  return createHmac('sha256', getPepper()).update(`runtime:${token}`).digest('hex');
}

export function issueRuntimeCredential() {
  const token = randomBytes(32).toString('base64url');
  return { token, digest: createRuntimeCredentialDigest(token) };
}

import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { issueRuntimeCredential } from '../src/modules/device/claim-secret.util.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const outputPath = resolve('.secrets/nanda-voice-companion-context.h');

try {
  const user = await prisma.msUser.findUnique({
    where: { email: 'nadia.pratama@happify.app' },
    select: { id: true, displayName: true },
  });
  if (!user) throw new Error('NANDA_DEMO_USER_NOT_FOUND: run npm run seed first.');

  const device = await prisma.msDevice.findFirst({
    where: {
      serialNumber: 'HAPPIFY-NANDA-VOICE-001',
      ownerId: user.id,
      status: 'PAIRED',
    },
    select: { id: true, serialNumber: true, displayName: true },
  });
  if (!device) throw new Error('NANDA_VOICE_DEVICE_NOT_PAIRED: run npm run seed first.');

  await prisma.trDeviceCredential.updateMany({
    where: { deviceId: device.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const credential = issueRuntimeCredential();
  const expiresAt = new Date(
    Date.now() + Number(process.env.DEVICE_CREDENTIAL_TTL_SECONDS ?? 2592000) * 1000,
  );
  await prisma.trDeviceCredential.create({
    data: { deviceId: device.id, tokenDigest: credential.digest, expiresAt },
  });

  const apiBaseUrl = (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/$/, '');
  const content = `#pragma once

#define HAPPIFY_API_BASE_URL "${apiBaseUrl}"
#define HAPPIFY_DEVICE_RUNTIME_TOKEN "${credential.token}"
#define HAPPIFY_USER_ID "${user.id}"
#define HAPPIFY_USER_NAME "${user.displayName ?? 'Nanda Pratama'}"
#define HAPPIFY_DEVICE_ID "${device.id}"
#define HAPPIFY_DEVICE_SERIAL "${device.serialNumber}"
#define HAPPIFY_VOICE_TURN_ENDPOINT "/devices/runtime/voice/turns"
#define HAPPIFY_VOICE_AUDIO_TEMPLATE "/devices/runtime/voice/turns/{turnId}/audio"
#define HAPPIFY_VOICE_LANGUAGE "id"
#define HAPPIFY_DEVICE_TOKEN_EXPIRES_AT "${expiresAt.toISOString()}"
`;

  await mkdir(resolve('.secrets'), { recursive: true });
  await writeFile(outputPath, content, { encoding: 'utf8', mode: 0o600 });
  console.log(`IoT context written to ${outputPath}.`);
  console.log(`Credential expires at ${expiresAt.toISOString()}.`);
} finally {
  await prisma.$disconnect();
}

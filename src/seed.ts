import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { firebaseAuth } from './config/firebase.js';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/happify?schema=public';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const email = 'susan.psychologist@gmail.com';
  const password = 'Susan123!';
  const displayName = 'Dr. Susan Maya';

  let firebaseUser = await firebaseAuth.getUserByEmail(email).catch(() => null);
  if (!firebaseUser) {
    firebaseUser = await firebaseAuth.createUser({ email, password, displayName, emailVerified: true });
  } else {
    firebaseUser = await firebaseAuth.updateUser(firebaseUser.uid, { email, password, displayName, emailVerified: true });
  }

  const user = await prisma.user.upsert({
    where: { firebaseUid: firebaseUser.uid },
    update: {
      email,
      displayName,
      role: 'PSYCHOLOGIST',
      avatarUrl: null,
      bio: 'Clinical psychologist focused on teen wellbeing, anxiety support, and safe emotional first response.',
    },
    create: {
      firebaseUid: firebaseUser.uid,
      email,
      displayName,
      role: 'PSYCHOLOGIST',
      avatarUrl: null,
      bio: 'Clinical psychologist focused on teen wellbeing, anxiety support, and safe emotional first response.',
    },
  });

  await prisma.psychologistApplication.upsert({
    where: { userId: user.id },
    update: {
      fullName: displayName,
      licenseNumber: 'PSI-SEED-001',
      certificateUrl: 'https://example.com/seed-psychologist-certificate',
      institution: 'Happify Care Network',
      reason: 'Seed account for testing professional care approval and chat flows.',
      status: 'APPROVED',
      reviewComment: 'Seed psychologist approved for local development.',
      reviewedAt: new Date(),
    },
    create: {
      userId: user.id,
      fullName: displayName,
      licenseNumber: 'PSI-SEED-001',
      certificateUrl: 'https://example.com/seed-psychologist-certificate',
      institution: 'Happify Care Network',
      reason: 'Seed account for testing professional care approval and chat flows.',
      status: 'APPROVED',
      reviewComment: 'Seed psychologist approved for local development.',
      reviewedAt: new Date(),
    },
  });

  console.log(`Seed psychologist ready: ${email} / ${password} (${user.id})`);
}

main()
  .finally(async () => prisma.$disconnect());

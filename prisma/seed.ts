import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { firebaseAuth } from '../src/config/firebase.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required to seed the database.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const effectiveAt = new Date('2026-07-17T00:00:00.000Z');
const today = new Date();
const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
const userEmail = 'nadia.pratama@happify.app';
const psychologistEmail = 'maya.santoso@happify.app';

const consentDocuments = [
  { scope: 'AI_PROCESSING' as const, version: 1, title: 'Persetujuan Pemrosesan AI', content: 'Happify dapat memproses konten wellbeing yang Anda pilih untuk memberikan refleksi dan dukungan. Hasil AI bukan diagnosis medis, terapi, atau layanan darurat.' },
  { scope: 'VOICE_PROCESSING' as const, version: 1, title: 'Persetujuan Pemrosesan Suara', content: 'Happify dapat memproses audio yang Anda kirim untuk transkripsi dan respons wellbeing. Gunakan layanan darurat setempat apabila Anda atau orang lain berada dalam bahaya segera.' },
  { scope: 'DEVICE_EMOTION_OBSERVATION' as const, version: 1, title: 'Persetujuan Observasi Emosi Perangkat', content: 'Perangkat pendamping dapat mengirim observasi emosi yang diekstrak untuk fitur wellbeing. Gambar kamera mentah tidak disimpan sebagai bagian dari observasi ini.' },
  { scope: 'HEATMAP_CONTRIBUTION' as const, version: 1, title: 'Persetujuan Kontribusi Heatmap Anonim', content: 'Happify dapat membuat satu kontribusi suasana hati per hari pada tingkat wilayah kasar. Lokasi presisi tidak digunakan untuk kontribusi ini.' },
];

const mindfulnessActivities = [
  { slug: 'breathing-box-id', type: 'BREATHING' as const, title: 'Napas Kotak', description: 'Latihan empat menit untuk membantu tubuh kembali ke ritme yang lebih tenang.', durationSeconds: 240, locale: 'id', steps: ['Tarik napas selama empat hitungan', 'Tahan selama empat hitungan', 'Buang napas selama empat hitungan', 'Tahan selama empat hitungan'] },
  { slug: 'grounding-five-senses-id', type: 'GROUNDING' as const, title: 'Grounding Lima Indra', description: 'Arahkan perhatian ke lingkungan sekitar saat pikiran terasa penuh.', durationSeconds: 300, locale: 'id', steps: ['Sebutkan lima hal yang dapat dilihat', 'Sebutkan empat hal yang dapat disentuh', 'Sebutkan tiga hal yang dapat didengar', 'Sebutkan dua hal yang dapat dicium', 'Sebutkan satu hal yang dapat dirasakan'] },
  { slug: 'mindful-pause-id', type: 'MEDITATION' as const, title: 'Jeda Sadar', description: 'Meditasi singkat untuk memberi ruang antara emosi dan respons.', durationSeconds: 180, locale: 'id', steps: ['Duduk dengan nyaman', 'Perhatikan napas tanpa mengubahnya', 'Sadari pikiran yang muncul', 'Kembali ke napas dengan lembut'] },
];

async function ensureFirebaseUser(email: string, displayName: string) {
  try {
    const user = await firebaseAuth.getUserByEmail(email);
    return { user, password: null as string | null };
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/user-not-found') {
      const password = `Hp!${randomBytes(18).toString('base64url')}`;
      const user = await firebaseAuth.createUser({ email, password, displayName, emailVerified: true, disabled: false });
      return { user, password };
    }
    throw error;
  }
}

async function main() {
  const [seededUser, seededPsychologist] = await Promise.all([
    ensureFirebaseUser(userEmail, 'Nadia Pratama'),
    ensureFirebaseUser(psychologistEmail, 'Dr. Maya Santoso, M.Psi., Psikolog'),
  ]);
  const firebaseUser = seededUser.user;
  const firebasePsychologist = seededPsychologist.user;

  await prisma.$transaction(async (tx) => {
    for (const code of ['USER', 'PSYCHOLOGIST', 'MODERATOR', 'ADMIN']) {
      await tx.msRole.upsert({ where: { code }, update: {}, create: { code } });
    }

    const user = await tx.msUser.upsert({
      where: { firebaseUid: firebaseUser.uid },
      update: { email: userEmail, displayName: 'Nadia Pratama', avatarUrl: null, bio: 'Sedang membangun kebiasaan refleksi yang lebih sehat.', role: 'USER' },
      create: { firebaseUid: firebaseUser.uid, email: userEmail, displayName: 'Nadia Pratama', bio: 'Sedang membangun kebiasaan refleksi yang lebih sehat.', role: 'USER' },
    });
    const psychologist = await tx.msUser.upsert({
      where: { firebaseUid: firebasePsychologist.uid },
      update: { email: psychologistEmail, displayName: 'Dr. Maya Santoso, M.Psi., Psikolog', avatarUrl: null, bio: 'Psikolog pendamping wellbeing.', role: 'PSYCHOLOGIST' },
      create: { firebaseUid: firebasePsychologist.uid, email: psychologistEmail, displayName: 'Dr. Maya Santoso, M.Psi., Psikolog', bio: 'Psikolog pendamping wellbeing.', role: 'PSYCHOLOGIST' },
    });

    await tx.trPsychologistApplication.upsert({
      where: { userId: psychologist.id },
      update: { fullName: 'Dr. Maya Santoso, M.Psi., Psikolog', licenseNumber: 'HAPPIFY-PSI-001', certificateUrl: 'https://example.invalid/credential-not-for-verification', institution: 'Happify Wellbeing Network', reason: 'Seeded clinical support workflow', status: 'APPROVED', reviewComment: 'Approved for seeded wellbeing workflow.', reviewedById: null, reviewedAt: effectiveAt },
      create: { userId: psychologist.id, fullName: 'Dr. Maya Santoso, M.Psi., Psikolog', licenseNumber: 'HAPPIFY-PSI-001', certificateUrl: 'https://example.invalid/credential-not-for-verification', institution: 'Happify Wellbeing Network', reason: 'Seeded clinical support workflow', status: 'APPROVED', reviewComment: 'Approved for seeded wellbeing workflow.', reviewedAt: effectiveAt },
    });

    for (const document of consentDocuments) {
      const savedDocument = await tx.msConsentDocument.upsert({
        where: { scope_version: { scope: document.scope, version: document.version } },
        update: { title: document.title, content: document.content, isActive: true, effectiveAt },
        create: { ...document, isActive: true, effectiveAt },
      });
      await tx.trUserConsent.upsert({
        where: { userId_documentId: { userId: user.id, documentId: savedDocument.id } },
        update: { scope: document.scope, version: document.version, status: 'ACCEPTED', acceptedAt: effectiveAt, revokedAt: null, source: 'seeded-wellbeing-profile' },
        create: { userId: user.id, documentId: savedDocument.id, scope: document.scope, version: document.version, status: 'ACCEPTED', acceptedAt: effectiveAt, source: 'seeded-wellbeing-profile' },
      });
    }

    await tx.msUserPreference.upsert({
      where: { userId: user.id },
      update: { primaryGoal: 'Mengelola stres kerja', triggers: ['beban kerja', 'kurang istirahat'], supportTone: 'Hangat dan reflektif', highRiskAction: 'Tampilkan dukungan profesional', accessibilityMode: [], textScale: 'STANDARD', highContrast: false, reducedMotion: false, screenReaderOptimized: false, consentToAi: true },
      create: { userId: user.id, primaryGoal: 'Mengelola stres kerja', triggers: ['beban kerja', 'kurang istirahat'], supportTone: 'Hangat dan reflektif', highRiskAction: 'Tampilkan dukungan profesional', accessibilityMode: [], textScale: 'STANDARD', highContrast: false, reducedMotion: false, screenReaderOptimized: false, consentToAi: true },
    });

    for (const activity of mindfulnessActivities) {
      const savedActivity = await tx.msMindfulnessActivity.upsert({ where: { slug: activity.slug }, update: { ...activity, isPublished: true }, create: { ...activity, isPublished: true } });
      await tx.trMindfulnessProgress.upsert({
        where: { userId_activityId: { userId: user.id, activityId: savedActivity.id } },
        update: { status: activity.slug === 'mindful-pause-id' ? 'STARTED' : 'COMPLETED', progressSeconds: activity.slug === 'mindful-pause-id' ? 90 : activity.durationSeconds, startedAt: effectiveAt, completedAt: activity.slug === 'mindful-pause-id' ? null : effectiveAt },
        create: { userId: user.id, activityId: savedActivity.id, status: activity.slug === 'mindful-pause-id' ? 'STARTED' : 'COMPLETED', progressSeconds: activity.slug === 'mindful-pause-id' ? 90 : activity.durationSeconds, startedAt: effectiveAt, completedAt: activity.slug === 'mindful-pause-id' ? null : effectiveAt },
      });
    }

    await tx.msDailyMotivation.upsert({ where: { date_locale: { date: todayUtc, locale: 'id' } }, update: { message: 'Satu langkah kecil yang konsisten tetap membawa perubahan.', author: 'Happify' }, create: { date: todayUtc, locale: 'id', message: 'Satu langkah kecil yang konsisten tetap membawa perubahan.', author: 'Happify' } });
    await tx.msDailyMotivation.upsert({ where: { date_locale: { date: todayUtc, locale: 'en' } }, update: { message: 'One consistent small step still creates change.', author: 'Happify' }, create: { date: todayUtc, locale: 'en', message: 'One consistent small step still creates change.', author: 'Happify' } });

    await tx.trMoodEntry.deleteMany({ where: { userId: user.id } });
    await tx.trMoodEntry.createMany({
      data: [
        { userId: user.id, state: 'CALM', intensity: 4, triggers: ['morning walk'], note: 'Lebih tenang setelah berjalan pagi.', createdAt: new Date('2026-07-12T01:30:00.000Z') },
        { userId: user.id, state: 'ANXIOUS', intensity: 3, triggers: ['deadline pekerjaan'], note: 'Sedikit cemas menjelang presentasi.', createdAt: new Date('2026-07-14T09:00:00.000Z') },
        { userId: user.id, state: 'NEUTRAL', intensity: 3, triggers: ['istirahat cukup'], note: 'Energi stabil dan fokus kembali.', createdAt: new Date('2026-07-16T02:00:00.000Z') },
      ],
    });
    await tx.trJournalEntry.deleteMany({ where: { userId: user.id } });
    await tx.trJournalEntry.createMany({
      data: [
        { userId: user.id, title: 'Merapikan prioritas', content: 'Hari ini saya membagi pekerjaan menjadi bagian yang lebih kecil dan memberi jeda setelah setiap fokus singkat.', detectedMood: 'CALM', riskLevel: 'LOW', aiReflection: 'Strategi membagi tugas dapat membantu menjaga beban terasa lebih terukur.', createdAt: new Date('2026-07-13T12:00:00.000Z') },
        { userId: user.id, title: 'Menjelang presentasi', content: 'Saya takut membuat kesalahan, tetapi sudah menyiapkan poin utama dan meminta umpan balik dari rekan kerja.', detectedMood: 'ANXIOUS', riskLevel: 'LOW', aiReflection: 'Persiapan dan mencari dukungan adalah langkah yang membantu. Coba beri ruang untuk napas sebelum presentasi.', createdAt: new Date('2026-07-15T11:30:00.000Z') },
      ],
    });
    await tx.msEmergencyContact.deleteMany({ where: { userId: user.id } });
    await tx.msEmergencyContact.create({ data: { userId: user.id, name: 'Rani Pratama', relationship: 'Saudara', phone: '+6281200000000', isPrimary: true } });
    await tx.trHeatmapContribution.upsert({ where: { userId_bucketDate: { userId: user.id, bucketDate: todayUtc } }, update: { regionKey: 'jakarta-selatan', mood: 'NEUTRAL' }, create: { userId: user.id, regionKey: 'jakarta-selatan', mood: 'NEUTRAL', bucketDate: todayUtc } });

    const seedReason = 'Routine wellbeing follow-up for seeded user profile';
    const existingReferrals = await tx.trReferral.findMany({ where: { userId: user.id, reason: seedReason }, select: { id: true } });
    if (existingReferrals.length) {
      await tx.trCareChatMessage.deleteMany({ where: { session: { referralId: { in: existingReferrals.map((referral) => referral.id) } } } });
      await tx.trCareChatSession.deleteMany({ where: { referralId: { in: existingReferrals.map((referral) => referral.id) } } });
      await tx.trReferral.deleteMany({ where: { id: { in: existingReferrals.map((referral) => referral.id) } } });
    }
    const referral = await tx.trReferral.create({ data: { userId: user.id, psychologistId: psychologist.id, riskLevel: 'MEDIUM', reason: seedReason, requestComment: 'User requested a supportive follow-up after recurring work-related anxiety.', backgroundSnapshot: { primaryGoal: 'Mengelola stres kerja', recentMood: 'NEUTRAL' }, providerName: 'Happify Wellbeing Network', providerType: 'Psychologist', status: 'ACCEPTED', reviewerComment: 'Follow-up accepted for non-emergency support.', reviewedAt: effectiveAt } });
    const chat = await tx.trCareChatSession.create({ data: { referralId: referral.id, userId: user.id, psychologistId: psychologist.id, status: 'OPEN', summary: 'Initial wellbeing follow-up is active.' } });
    await tx.trCareChatMessage.createMany({ data: [
      { sessionId: chat.id, senderId: user.id, content: 'Halo, saya ingin membahas cara mengelola rasa cemas menjelang pekerjaan penting.', createdAt: new Date('2026-07-16T08:30:00.000Z') },
      { sessionId: chat.id, senderId: psychologist.id, content: 'Terima kasih sudah berbagi. Kita bisa mulai dengan mengenali situasi yang paling memicu dan memilih satu strategi yang realistis untuk dicoba minggu ini.', createdAt: new Date('2026-07-16T08:38:00.000Z') },
    ] });
  });

  for (const account of [
    { email: userEmail, password: seededUser.password },
    { email: psychologistEmail, password: seededPsychologist.password },
  ]) {
    if (account.password) console.log(`Created Firebase account ${account.email} with password: ${account.password}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

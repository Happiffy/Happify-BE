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

async function ensureFirebaseUser(email: string, displayName: string, resetPassword: boolean) {
  const password = `Hp!${randomBytes(18).toString('base64url')}`;
  try {
    const existing = await firebaseAuth.getUserByEmail(email);
    const user = resetPassword
      ? await firebaseAuth.updateUser(existing.uid, { password, displayName, disabled: false })
      : existing;
    return { user, password: resetPassword ? password : null as string | null };
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/user-not-found') {
      const user = await firebaseAuth.createUser({ email, password, displayName, emailVerified: true, disabled: false });
      return { user, password };
    }
    throw error;
  }
}

async function main() {
  const [existingUser, existingPsychologist] = await Promise.all([
    prisma.msUser.findUnique({ where: { email: userEmail }, select: { id: true } }),
    prisma.msUser.findUnique({ where: { email: psychologistEmail }, select: { id: true } }),
  ]);
  const [seededUser, seededPsychologist] = await Promise.all([
    ensureFirebaseUser(userEmail, 'Nanda Pratama', !existingUser),
    ensureFirebaseUser(psychologistEmail, 'Dr. Maya Santoso, M.Psi., Psikolog', !existingPsychologist),
  ]);
  const firebaseUser = seededUser.user;
  const firebasePsychologist = seededPsychologist.user;

  await prisma.$transaction(async (tx) => {
    for (const code of ['USER', 'PSYCHOLOGIST', 'MODERATOR', 'ADMIN']) {
      await tx.msRole.upsert({ where: { code }, update: {}, create: { code } });
    }

    const user = await tx.msUser.upsert({
      where: { firebaseUid: firebaseUser.uid },
      update: { email: userEmail, displayName: 'Nanda Pratama', avatarUrl: null, bio: 'Sedang membangun kebiasaan refleksi yang lebih sehat.', role: 'USER' },
      create: { firebaseUid: firebaseUser.uid, email: userEmail, displayName: 'Nanda Pratama', bio: 'Sedang membangun kebiasaan refleksi yang lebih sehat.', role: 'USER' },
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
        { userId: user.id, state: 'CALM', intensity: 4, triggers: ['morning walk'], note: 'Lebih tenang setelah berjalan pagi.', createdAt: new Date('2026-07-10T01:30:00.000Z') },
        { userId: user.id, state: 'HAPPY', intensity: 4, triggers: ['completed task'], note: 'Senang karena satu tugas besar akhirnya selesai.', createdAt: new Date('2026-07-11T10:15:00.000Z') },
        { userId: user.id, state: 'ANXIOUS', intensity: 3, triggers: ['deadline pekerjaan'], note: 'Sedikit cemas menjelang presentasi.', createdAt: new Date('2026-07-14T09:00:00.000Z') },
        { userId: user.id, state: 'CALM', intensity: 4, triggers: ['breathing exercise'], note: 'Napas kotak membantu saya berhenti terburu-buru.', createdAt: new Date('2026-07-15T03:45:00.000Z') },
        { userId: user.id, state: 'NEUTRAL', intensity: 3, triggers: ['istirahat cukup'], note: 'Energi stabil dan fokus kembali.', createdAt: new Date('2026-07-16T02:00:00.000Z') },
        { userId: user.id, state: 'ANXIOUS', intensity: 2, triggers: ['meeting mendadak'], note: 'Tegang sebentar, lalu menuliskan poin yang bisa saya kontrol.', createdAt: new Date('2026-07-16T09:30:00.000Z') },
        { userId: user.id, state: 'CALM', intensity: 4, triggers: ['evening routine'], note: 'Menutup hari dengan lebih pelan dan tidak membawa pekerjaan ke waktu istirahat.', createdAt: new Date('2026-07-17T12:00:00.000Z') },
      ],
    });
    await tx.trJournalEntry.deleteMany({ where: { userId: user.id } });
    await tx.trJournalEntry.createMany({
      data: [
        { userId: user.id, title: 'Merapikan prioritas', content: 'Hari ini saya membagi pekerjaan menjadi bagian yang lebih kecil dan memberi jeda setelah setiap fokus singkat.', detectedMood: 'CALM', riskLevel: 'LOW', aiReflection: 'Strategi membagi tugas dapat membantu menjaga beban terasa lebih terukur.', createdAt: new Date('2026-07-11T12:00:00.000Z') },
        { userId: user.id, title: 'Menjelang presentasi', content: 'Saya takut membuat kesalahan, tetapi sudah menyiapkan poin utama dan meminta umpan balik dari rekan kerja.', detectedMood: 'ANXIOUS', riskLevel: 'LOW', aiReflection: 'Persiapan dan mencari dukungan adalah langkah yang membantu. Coba beri ruang untuk napas sebelum presentasi.', createdAt: new Date('2026-07-13T11:30:00.000Z') },
        { userId: user.id, title: 'Jeda sebelum membalas pesan', content: 'Saya memilih menunda membalas pesan kerja saat sedang lelah. Setelah makan dan minum, respons saya jadi lebih jelas.', detectedMood: 'NEUTRAL', riskLevel: 'LOW', aiReflection: 'Memberi jeda sebelum merespons adalah bentuk batas yang sehat dan dapat dipraktikkan lagi.', createdAt: new Date('2026-07-15T14:00:00.000Z') },
        { userId: user.id, title: 'Hal kecil yang berhasil', content: 'Saya menyelesaikan daftar prioritas, berjalan sebentar, dan menelepon teman. Hari ini tidak sempurna, tetapi terasa cukup.', detectedMood: 'HAPPY', riskLevel: 'LOW', aiReflection: 'Mencatat keberhasilan kecil dapat memperkuat rasa mampu dan membantu melihat pola yang mendukung.', createdAt: new Date('2026-07-17T12:30:00.000Z') },
      ],
    });
    const communityProfiles = await Promise.all([
      { firebaseUid: 'seed-community-01', email: 'community.01@seed.happify.invalid' },
      { firebaseUid: 'seed-community-02', email: 'community.02@seed.happify.invalid' },
      { firebaseUid: 'seed-community-03', email: 'community.03@seed.happify.invalid' },
      { firebaseUid: 'seed-community-04', email: 'community.04@seed.happify.invalid' },
      { firebaseUid: 'seed-community-05', email: 'community.05@seed.happify.invalid' },
      { firebaseUid: 'seed-community-06', email: 'community.06@seed.happify.invalid' },
      { firebaseUid: 'seed-community-07', email: 'community.07@seed.happify.invalid' },
      { firebaseUid: 'seed-community-08', email: 'community.08@seed.happify.invalid' },
      { firebaseUid: 'seed-community-09', email: 'community.09@seed.happify.invalid' },
    ].map((account) => tx.msUser.upsert({
      where: { firebaseUid: account.firebaseUid },
      update: { email: account.email, displayName: 'Anonymous community member', role: 'USER' },
      create: { firebaseUid: account.firebaseUid, email: account.email, displayName: 'Anonymous community member', role: 'USER' },
    })));
    const [communityOne, communityTwo, communityThree, communityFour, communityFive, communitySix, communitySeven, communityEight, communityNine] = communityProfiles;
    if (!communityOne || !communityTwo || !communityThree || !communityFour || !communityFive || !communitySix || !communitySeven || !communityEight || !communityNine) throw new Error('Community seed profiles are missing.');
    const communityUserIds = [user.id, communityOne.id, communityTwo.id, communityThree.id, communityFour.id, communityFive.id, communitySix.id, communitySeven.id, communityEight.id, communityNine.id];
    await tx.trCommunityPost.deleteMany({ where: { userId: { in: communityUserIds } } });
    const communityPosts = await Promise.all([
      { userId: user.id, content: 'Hari ini saya mencoba membagi tugas besar menjadi tiga langkah kecil. Rasanya masih menegangkan, tapi lebih mungkin dikerjakan.', mood: 'ANXIOUS' as const, createdAt: new Date('2026-07-16T10:00:00.000Z') },
      { userId: user.id, content: 'Pengingat untuk diri sendiri: istirahat lima menit bukan berarti saya gagal produktif.', mood: 'CALM' as const, createdAt: new Date('2026-07-17T04:30:00.000Z') },
      { userId: communityOne.id, content: 'Saya mulai menaruh ponsel jauh dari meja saat fokus. Ternyata lima belas menit tanpa distraksi sudah cukup membantu.', mood: 'CALM' as const, createdAt: new Date('2026-07-16T07:00:00.000Z') },
      { userId: communityTwo.id, content: 'Menulis satu hal yang masih bisa saya kendalikan membuat hari yang padat terasa tidak terlalu berat.', mood: 'NEUTRAL' as const, createdAt: new Date('2026-07-16T12:15:00.000Z') },
      { userId: communityThree.id, content: 'Saya sedang belajar meminta waktu sebelum menjawab pesan yang membuat saya tertekan.', mood: 'ANXIOUS' as const, createdAt: new Date('2026-07-17T02:40:00.000Z') },
      { userId: communityFour.id, content: 'Jalan singkat setelah makan siang membantu saya kembali fokus tanpa memaksakan diri.', mood: 'HAPPY' as const, createdAt: new Date('2026-07-17T05:10:00.000Z') },
    ].map((post) => tx.trCommunityPost.create({ data: { ...post, alias: 'Anonymous', supportCount: 0 } })));
    const [postOne, postTwo, postThree, postFour, postFive, postSix] = communityPosts;
    if (!postOne || !postTwo || !postThree || !postFour || !postFive || !postSix) throw new Error('Community seed posts are missing.');
    await tx.trCommunityComment.createMany({
      data: [
        { postId: postOne.id, userId: communityOne.id, alias: 'Anonymous', content: 'Terima kasih sudah berbagi. Membuat langkah pertama lebih kecil juga membantu saya.', createdAt: new Date('2026-07-16T10:15:00.000Z') },
        { postId: postOne.id, userId: user.id, alias: 'Anonymous', content: 'Saya mulai dari menulis tiga poin utama dulu.', createdAt: new Date('2026-07-16T10:25:00.000Z') },
        { postId: postThree.id, userId: communityThree.id, alias: 'Anonymous', content: 'Ide yang baik. Saya ingin mencoba hal yang sama besok.', createdAt: new Date('2026-07-16T07:20:00.000Z') },
        { postId: postFive.id, userId: communityFive.id, alias: 'Anonymous', content: 'Memberi jeda itu valid. Semoga kamu bisa menemukan ritme yang nyaman.', createdAt: new Date('2026-07-17T03:00:00.000Z') },
      ],
    });
    await tx.trCommunitySupport.createMany({ data: [
      { userId: communityOne.id, postId: postOne.id },
      { userId: communityTwo.id, postId: postOne.id },
      { userId: communityThree.id, postId: postTwo.id },
      { userId: communityFour.id, postId: postThree.id },
      { userId: communityFive.id, postId: postFive.id },
    ] });
    await Promise.all(communityPosts.map((post) => tx.trCommunityPost.update({
      where: { id: post.id },
      data: { supportCount: 1 },
    })));
    await tx.msEmergencyContact.deleteMany({ where: { userId: user.id } });
    await tx.msEmergencyContact.create({ data: { userId: user.id, name: 'Rani Pratama', relationship: 'Saudara', phone: '+6281200000000', isPrimary: true } });
    await tx.trHeatmapContribution.deleteMany({ where: { userId: { in: communityUserIds }, bucketDate: todayUtc } });
    await tx.trHeatmapContribution.createMany({
      data: [
        { userId: user.id, regionKey: 'GS62_E1068', mood: 'NEUTRAL', bucketDate: todayUtc },
        { userId: communityOne.id, regionKey: 'GS62_E1068', mood: 'CALM', bucketDate: todayUtc },
        { userId: communityTwo.id, regionKey: 'GS62_E1068', mood: 'CALM', bucketDate: todayUtc },
        { userId: communityThree.id, regionKey: 'GS62_E1068', mood: 'HAPPY', bucketDate: todayUtc },
        { userId: communityFour.id, regionKey: 'GS62_E1068', mood: 'NEUTRAL', bucketDate: todayUtc },
        { userId: communityFive.id, regionKey: 'GS61_E1068', mood: 'ANXIOUS', bucketDate: todayUtc },
        { userId: communitySix.id, regionKey: 'GS61_E1068', mood: 'NEUTRAL', bucketDate: todayUtc },
        { userId: communitySeven.id, regionKey: 'GS61_E1068', mood: 'HAPPY', bucketDate: todayUtc },
        { userId: communityEight.id, regionKey: 'GS61_E1068', mood: 'CALM', bucketDate: todayUtc },
        { userId: communityNine.id, regionKey: 'GS61_E1068', mood: 'ANXIOUS', bucketDate: todayUtc },
      ],
    });

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
      { sessionId: chat.id, senderId: user.id, content: 'Biasanya rasa tegang muncul saat agenda berubah mendadak atau ketika saya merasa belum cukup siap.', createdAt: new Date('2026-07-16T08:44:00.000Z') },
      { sessionId: chat.id, senderId: psychologist.id, content: 'Masuk akal. Untuk minggu ini, coba buat daftar singkat: hal yang bisa dikendalikan, hal yang perlu ditanyakan, dan satu jeda napas sebelum rapat.', createdAt: new Date('2026-07-16T08:51:00.000Z') },
      { sessionId: chat.id, senderId: user.id, content: 'Saya sudah mencoba napas kotak sebelum rapat siang ini. Tidak langsung hilang, tapi saya lebih bisa fokus mendengar.', createdAt: new Date('2026-07-17T03:20:00.000Z') },
      { sessionId: chat.id, senderId: psychologist.id, content: 'Itu perkembangan yang baik. Tujuannya bukan menghilangkan semua rasa cemas, melainkan memberi ruang agar Anda bisa memilih respons yang membantu.', createdAt: new Date('2026-07-17T03:32:00.000Z') },
    ] });
  }, { maxWait: 15000, timeout: 60000 });

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

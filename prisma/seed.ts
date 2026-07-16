import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required to seed the database.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const effectiveAt = new Date('2026-07-17T00:00:00.000Z');
const today = new Date();
const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

const consentDocuments = [
  {
    scope: 'AI_PROCESSING' as const,
    version: 1,
    title: 'Persetujuan Pemrosesan AI',
    content:
      'Happify dapat memproses konten wellbeing yang Anda pilih untuk memberikan refleksi dan dukungan. Hasil AI bukan diagnosis medis, terapi, atau layanan darurat.',
  },
  {
    scope: 'VOICE_PROCESSING' as const,
    version: 1,
    title: 'Persetujuan Pemrosesan Suara',
    content:
      'Happify dapat memproses audio yang Anda kirim untuk transkripsi dan respons wellbeing. Gunakan layanan darurat setempat apabila Anda atau orang lain berada dalam bahaya segera.',
  },
  {
    scope: 'DEVICE_EMOTION_OBSERVATION' as const,
    version: 1,
    title: 'Persetujuan Observasi Emosi Perangkat',
    content:
      'Perangkat pendamping dapat mengirim observasi emosi yang diekstrak untuk fitur wellbeing. Gambar kamera mentah tidak disimpan sebagai bagian dari observasi ini.',
  },
  {
    scope: 'HEATMAP_CONTRIBUTION' as const,
    version: 1,
    title: 'Persetujuan Kontribusi Heatmap Anonim',
    content:
      'Happify dapat membuat satu kontribusi suasana hati per hari pada tingkat wilayah kasar. Lokasi presisi tidak digunakan untuk kontribusi ini.',
  },
];

const mindfulnessActivities = [
  {
    slug: 'breathing-box-id',
    type: 'BREATHING' as const,
    title: 'Napas Kotak',
    description: 'Latihan empat menit untuk membantu tubuh kembali ke ritme yang lebih tenang.',
    durationSeconds: 240,
    locale: 'id',
    steps: ['Tarik napas selama empat hitungan', 'Tahan selama empat hitungan', 'Buang napas selama empat hitungan', 'Tahan selama empat hitungan'],
  },
  {
    slug: 'grounding-five-senses-id',
    type: 'GROUNDING' as const,
    title: 'Grounding Lima Indra',
    description: 'Arahkan perhatian ke lingkungan sekitar saat pikiran terasa penuh.',
    durationSeconds: 300,
    locale: 'id',
    steps: ['Sebutkan lima hal yang dapat dilihat', 'Sebutkan empat hal yang dapat disentuh', 'Sebutkan tiga hal yang dapat didengar', 'Sebutkan dua hal yang dapat dicium', 'Sebutkan satu hal yang dapat dirasakan'],
  },
  {
    slug: 'mindful-pause-id',
    type: 'MEDITATION' as const,
    title: 'Jeda Sadar',
    description: 'Meditasi singkat untuk memberi ruang antara emosi dan respons.',
    durationSeconds: 180,
    locale: 'id',
    steps: ['Duduk dengan nyaman', 'Perhatikan napas tanpa mengubahnya', 'Sadari pikiran yang muncul', 'Kembali ke napas dengan lembut'],
  },
];

const dailyMotivations = [
  { locale: 'id', message: 'Satu langkah kecil yang konsisten tetap membawa perubahan.', author: 'Happify' },
  { locale: 'en', message: 'One consistent small step still creates change.', author: 'Happify' },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    for (const code of ['USER', 'PSYCHOLOGIST', 'MODERATOR', 'ADMIN']) {
      await tx.msRole.upsert({ where: { code }, update: {}, create: { code } });
    }

    for (const document of consentDocuments) {
      await tx.msConsentDocument.upsert({
        where: { scope_version: { scope: document.scope, version: document.version } },
        update: { title: document.title, content: document.content, isActive: true, effectiveAt },
        create: { ...document, isActive: true, effectiveAt },
      });
    }

    for (const activity of mindfulnessActivities) {
      await tx.msMindfulnessActivity.upsert({
        where: { slug: activity.slug },
        update: { ...activity, isPublished: true },
        create: { ...activity, isPublished: true },
      });
    }

    for (const motivation of dailyMotivations) {
      await tx.msDailyMotivation.upsert({
        where: { date_locale: { date: todayUtc, locale: motivation.locale } },
        update: motivation,
        create: { date: todayUtc, ...motivation },
      });
    }
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

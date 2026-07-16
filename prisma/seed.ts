import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/happify?schema=public';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const effectiveAt = new Date('2026-01-01T00:00:00.000Z');
  const documents = [
    { scope: 'AI_PROCESSING' as const, version: 1, title: 'AI Processing Consent', content: 'Allows Happify to process selected wellbeing content with AI to provide reflections. AI output is not a diagnosis or emergency service.' },
    { scope: 'VOICE_PROCESSING' as const, version: 1, title: 'Voice Processing Consent', content: 'Allows encrypted voice audio to be sent to the configured voice service for transcription and a wellbeing response. Temporary generated audio expires.' },
    { scope: 'DEVICE_EMOTION_OBSERVATION' as const, version: 1, title: 'Companion Emotion Observation Consent', content: 'Allows a paired companion to submit already-extracted voice, camera, or fused emotion observations with confidence, model provenance, and retention metadata. Raw camera images are not accepted or stored.' },
    { scope: 'HEATMAP_CONTRIBUTION' as const, version: 1, title: 'Anonymous Heatmap Contribution', content: 'Allows one coarse regional mood contribution per day. Exact coordinates are not stored and results are only shown above the privacy cohort threshold.' },
  ];
  for (const document of documents) await prisma.consentDocument.upsert({ where: { scope_version: { scope: document.scope, version: document.version } }, update: { ...document, isActive: true, effectiveAt }, create: { ...document, effectiveAt } });

  const activities = [
    { slug: 'box-breathing-id', type: 'BREATHING' as const, title: 'Napas Kotak', description: 'Latihan napas singkat untuk membantu menenangkan tubuh.', durationSeconds: 240, locale: 'id', steps: ['Tarik napas selama empat hitungan', 'Tahan selama empat hitungan', 'Buang napas selama empat hitungan', 'Tahan selama empat hitungan'] },
    { slug: 'five-senses-grounding-id', type: 'GROUNDING' as const, title: 'Grounding Lima Indra', description: 'Kembali ke saat ini dengan memperhatikan lingkungan sekitar.', durationSeconds: 300, locale: 'id', steps: ['Sebutkan lima hal yang terlihat', 'Empat hal yang dapat disentuh', 'Tiga hal yang terdengar', 'Dua hal yang tercium', 'Satu hal yang terasa'] },
    { slug: 'calm-breathing-en', type: 'BREATHING' as const, title: 'Calm Breathing', description: 'A short paced breathing practice.', durationSeconds: 240, locale: 'en', steps: ['Breathe in slowly', 'Pause gently', 'Breathe out longer', 'Repeat without forcing'] },
  ];
  for (const activity of activities) await prisma.mindfulnessActivity.upsert({ where: { slug: activity.slug }, update: { ...activity, isPublished: true }, create: activity });

  const providers = [
    { slug: 'happify-care-network', name: 'Happify Care Network', type: 'PSYCHOLOGIST' as const, description: 'Example verified provider listing for professional wellbeing support.', phone: null, websiteUrl: 'https://example.com/happify-care', address: null, region: 'Indonesia', languages: ['id', 'en'], isEmergency: false, isVerified: true, isActive: true },
    { slug: 'example-crisis-line', name: 'Example Crisis Support Line', type: 'CRISIS_LINE' as const, description: 'Example emergency provider entry. Replace with verified local resources before production use.', phone: '+620000000000', websiteUrl: 'https://example.com/crisis-support', address: null, region: 'Indonesia', languages: ['id'], isEmergency: true, isVerified: false, isActive: true },
  ];
  for (const provider of providers) await prisma.provider.upsert({ where: { slug: provider.slug }, update: provider, create: provider });

  const today = new Date();
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  await prisma.dailyMotivation.upsert({ where: { date_locale: { date, locale: 'id' } }, update: { message: 'Langkah kecil hari ini tetap berarti.', author: 'Happify' }, create: { date, locale: 'id', message: 'Langkah kecil hari ini tetap berarti.', author: 'Happify' } });
  await prisma.dailyMotivation.upsert({ where: { date_locale: { date, locale: 'en' } }, update: { message: 'A small step today still matters.', author: 'Happify' }, create: { date, locale: 'en', message: 'A small step today still matters.', author: 'Happify' } });
}

main().finally(async () => prisma.$disconnect());

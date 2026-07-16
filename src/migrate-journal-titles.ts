import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { richTextToPlainText } from './utils/html.util.js';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/happify?schema=public';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

function topicTitle(text: string, riskLevel: string) {
  const value = text.toLowerCase();
  if (riskLevel === 'CRISIS' || /bunuh diri|suicide|mati aja/.test(value)) return 'Butuh Dukungan Segera';
  if (/ketemu|bertemu|orang baru|kenalan/.test(value)) return 'Pertemuan Hari Ini';
  if (/sekolah|tugas|ujian|belajar/.test(value)) return 'Tekanan Sekolah';
  if (/capek|cape|lelah|overwhelmed/.test(value)) return 'Hari yang Melelahkan';
  if (/cemas|khawatir|panic|panik|takut/.test(value)) return 'Rasa Cemas';
  if (/makan|lapar/.test(value)) return 'Tentang Keseharian';
  return 'Catatan Hari Ini';
}

async function main() {
  const journals = await prisma.journalEntry.findMany({ select: { id: true, title: true, content: true, riskLevel: true } });
  let changed = 0;
  for (const journal of journals) {
    const content = richTextToPlainText(journal.content);
    const normalizedTitle = journal.title.toLowerCase().replace(/[.!?]+$/, '').trim();
    const normalizedContent = content.toLowerCase().replace(/[.!?]+$/, '').trim();
    if (normalizedTitle !== normalizedContent && journal.title !== 'Daily reflection') continue;
    await prisma.journalEntry.update({ where: { id: journal.id }, data: { title: topicTitle(content, journal.riskLevel) } });
    changed += 1;
  }
  console.log(`Updated ${changed} duplicate journal titles`);
}

main().finally(async () => prisma.$disconnect());

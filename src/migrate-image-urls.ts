import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/happify?schema=public';
const publicApiUrl = process.env.PUBLIC_API_URL ?? 'http://localhost:4000';
const bucket = process.env.S3_BUCKET_NAME ?? '';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

function proxyUrl(url: string | null) {
  if (!url || !url.includes('storageapi.dev')) return null;
  const marker = `/${bucket}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return `${publicApiUrl}/media/images/${encodeURIComponent(url.slice(index + marker.length))}`;
}

async function main() {
  const [posts, comments, messages] = await Promise.all([
    prisma.communityPost.findMany({ where: { imageUrl: { contains: 'storageapi.dev' } }, select: { id: true, imageUrl: true } }),
    prisma.communityComment.findMany({ where: { imageUrl: { contains: 'storageapi.dev' } }, select: { id: true, imageUrl: true } }),
    prisma.careChatMessage.findMany({ where: { imageUrl: { contains: 'storageapi.dev' } }, select: { id: true, imageUrl: true } }),
  ]);

  let changed = 0;
  for (const post of posts) {
    const imageUrl = proxyUrl(post.imageUrl);
    if (imageUrl) { await prisma.communityPost.update({ where: { id: post.id }, data: { imageUrl } }); changed += 1; }
  }
  for (const comment of comments) {
    const imageUrl = proxyUrl(comment.imageUrl);
    if (imageUrl) { await prisma.communityComment.update({ where: { id: comment.id }, data: { imageUrl } }); changed += 1; }
  }
  for (const message of messages) {
    const imageUrl = proxyUrl(message.imageUrl);
    if (imageUrl) { await prisma.careChatMessage.update({ where: { id: message.id }, data: { imageUrl } }); changed += 1; }
  }
  console.log(`Migrated ${changed} legacy image URLs`);
}

main().finally(async () => prisma.$disconnect());

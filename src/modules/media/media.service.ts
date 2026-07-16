import { randomUUID } from 'node:crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const endpoint = process.env.S3_ENDPOINT_URL;
const region = process.env.S3_REGION ?? 'auto';
const bucket = process.env.S3_BUCKET_NAME;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

function getClient() {
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error('S3_NOT_CONFIGURED');
  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getExtension(contentType: string) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

class MediaService {
  async uploadImage(body: { imageBase64: string, contentType: string }) {
    const client = getClient();
    const key = `happify/${randomUUID()}.${getExtension(body.contentType)}`;
    const buffer = Buffer.from(body.imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ''), 'base64');

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: body.contentType,
      ACL: 'public-read',
    }));

    const publicApiUrl = process.env.PUBLIC_API_URL ?? 'http://localhost:4000';
    return { url: `${publicApiUrl}/media/images/${encodeURIComponent(key)}`, key };
  }

  async getImage(key: string) {
    const client = getClient();
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) throw new Error('NOT_FOUND');
    return { buffer: Buffer.from(bytes), contentType: object.ContentType ?? 'image/jpeg' };
  }
}

export default new MediaService();

import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env, hasStorage } from '../config/env.js';

const client = hasStorage ? new S3Client({
  region: env.OBJECT_STORAGE_REGION,
  endpoint: env.OBJECT_STORAGE_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY, secretAccessKey: env.OBJECT_STORAGE_SECRET_KEY }
}) : null;

export function assertStorageReady() {
  if (!client) throw Object.assign(new Error('Private object storage is not configured.'), { status: 503, code: 'STORAGE_NOT_CONFIGURED' });
}

export async function createUploadUrl({ projectId, fileName, mimeType, size }) {
  assertStorageReady();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  const key = `projects/${projectId}/sources/${randomUUID()}-${safeName}`;
  const command = new PutObjectCommand({ Bucket: env.OBJECT_STORAGE_BUCKET, Key: key, ContentType: mimeType });
  const url = await getSignedUrl(client, command, { expiresIn: 600 });
  return { key, url, expiresIn: 600 };
}

export async function verifyUploadedObject(key, expectedSize) {
  assertStorageReady();
  const head = await client.send(new HeadObjectCommand({ Bucket: env.OBJECT_STORAGE_BUCKET, Key: key }));
  if (Number(head.ContentLength) !== Number(expectedSize)) throw Object.assign(new Error('Uploaded file size did not match the upload request.'), { status: 400, code: 'UPLOAD_SIZE_MISMATCH' });
  return head;
}

export async function createDownloadUrl(key, expiresIn = 900) {
  assertStorageReady();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.OBJECT_STORAGE_BUCKET, Key: key }), { expiresIn });
}

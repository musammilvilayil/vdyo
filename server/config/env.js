import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().optional(),
  REDIS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORAGE_REGION: z.string().default('auto'),
  OBJECT_STORAGE_BUCKET: z.string().default('vdyo-media'),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024 * 1024),
  ALLOWED_UPLOAD_TYPES: z.string().default('video/mp4,video/quicktime,video/webm,image/jpeg,image/png,audio/mpeg,audio/mp4')
});

export const env = schema.parse(process.env);
export const hasDatabase = Boolean(env.MONGODB_URI);
export const hasQueue = Boolean(env.REDIS_URL);
export const hasAI = Boolean(env.OPENAI_API_KEY);
export const hasStorage = Boolean(env.OBJECT_STORAGE_ENDPOINT && env.OBJECT_STORAGE_ACCESS_KEY && env.OBJECT_STORAGE_SECRET_KEY);

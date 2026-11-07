import mongoose from 'mongoose';
import { env, hasDatabase } from './config/env.js';

export async function connectDatabase() {
  if (!hasDatabase) {
    console.warn('[db] MONGODB_URI is not configured; persistence is disabled.');
    return false;
  }
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('[db] MongoDB connected');
  return true;
}

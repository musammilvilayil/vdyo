import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env, hasQueue } from './config/env.js';

let connection;
let videoQueue;

export function getVideoQueue() {
  if (!hasQueue) throw Object.assign(new Error('REDIS_URL is not configured; background processing is unavailable.'), { status: 503, code: 'QUEUE_NOT_CONFIGURED' });
  if (!videoQueue) {
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });
    videoQueue = new Queue('vdyo-video-jobs', { connection, defaultJobOptions: {
      attempts: 3, backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400, count: 500 }, removeOnFail: { age: 604800, count: 1000 }
    }});
  }
  return videoQueue;
}

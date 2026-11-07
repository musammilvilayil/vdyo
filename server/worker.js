import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { env } from './config/env.js';
import { Project } from './models/Project.js';

if (!env.REDIS_URL || !env.MONGODB_URI) throw new Error('REDIS_URL and MONGODB_URI are required to run the video worker.');
await mongoose.connect(env.MONGODB_URI);
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || 'ffmpeg', args, { stdio: ['ignore','ignore','pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-6000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}: ${stderr}`)));
  });
}

const worker = new Worker('vdyo-video-jobs', async job => {
  const project = await Project.findById(job.data.projectId);
  if (!project) throw new Error('Project no longer exists.');
  project.status = 'analysing'; project.progress = 12; await project.save();
  // Rendering is intentionally gated until a storage download adapter and
  // media-inspection pipeline are configured. Never emit a fake completed file.
  project.status = 'failed';
  project.error = { code: 'RENDER_PIPELINE_NOT_CONFIGURED', message: 'The queue is connected, but the media download, scene-analysis and export pipeline still needs to be configured.' };
  await project.save();
  throw new Error(project.error.message);
}, { connection, concurrency: Number(process.env.VIDEO_WORKER_CONCURRENCY || 1) });

worker.on('completed', job => console.log('[worker] completed', job.id));
worker.on('failed', (job, error) => console.error('[worker] failed', job?.id, error.message));
console.log('[worker] VDYO video worker is listening');

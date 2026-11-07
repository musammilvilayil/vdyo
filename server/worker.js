import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from './config/env.js';
import { Project } from './models/Project.js';
import { downloadObjectToFile, uploadFile } from './services/storage.js';

if (!env.REDIS_URL || !env.MONGODB_URI) throw new Error('REDIS_URL and MONGODB_URI are required to run the video worker.');
await mongoose.connect(env.MONGODB_URI);
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
const dimensions = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', chunk => { stdout = (stdout + chunk.toString()).slice(-12000); });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-12000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(command + ' exited with ' + code + ': ' + stderr)));
  });
}

async function probe(file) {
  const result = await run(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  return JSON.parse(result.stdout);
}

async function renderProject(project, job) {
  const videos = project.assets.filter(asset => asset.status === 'uploaded' && asset.mimeType.startsWith('video/'));
  if (!videos.length) throw Object.assign(new Error('Upload at least one video clip. Image-only and audio-only edits are not supported by this renderer yet.'), { code: 'NO_VIDEO_ASSETS' });

  const work = await mkdtemp(join(tmpdir(), 'vdyo-'));
  try {
    const size = dimensions[project.aspectRatio] || dimensions['9:16'];
    const width = size[0]; const height = size[1];
    const target = Math.max(5, Number(project.targetDurationSeconds) || 30);
    const segment = target / videos.length;
    const normalized = [];

    for (let index = 0; index < videos.length; index++) {
      const asset = videos[index];
      const source = join(work, 'source-' + index + '.media');
      const output = join(work, 'clip-' + index + '.mp4');
      await downloadObjectToFile(asset.key, source);
      const metadata = await probe(source);
      const video = (metadata.streams || []).find(stream => stream.codec_type === 'video');
      if (!video) throw new Error('No video stream found in ' + asset.originalName + '.');
      const duration = Number(metadata.format?.duration || video.duration || 0);
      if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not read duration for ' + asset.originalName + '.');
      const clipDuration = Math.min(duration, segment);
      const hasAudio = (metadata.streams || []).some(stream => stream.codec_type === 'audio');
      const args = ['-y', '-i', source];
      if (!hasAudio) args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');
      args.push('-t', String(clipDuration), '-map', '0:v:0');
      args.push(...(hasAudio ? ['-map', '0:a:0'] : ['-map', '1:a:0']));
      args.push('-vf', 'scale=' + width + ':' + height + ':force_original_aspect_ratio=increase,crop=' + width + ':' + height + ',setsar=1,fps=30');
      args.push('-c:v', 'libx264', '-preset', process.env.FFMPEG_PRESET || 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p');
      args.push('-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-af', 'aresample=async=1:first_pts=0', '-movflags', '+faststart', output);
      await run(ffmpeg, args);
      normalized.push(output);
      const progress = Math.round(15 + ((index + 1) / videos.length) * 55);
      await job.updateProgress(progress);
      await Project.updateOne({ _id: project._id }, { status: 'rendering', progress });
    }

    const concatList = join(work, 'concat.txt');
    await writeFile(concatList, normalized.map(file => "file '" + file.replaceAll("'", "'\\''") + "'").join('\n'));
    const rendered = join(work, 'render.mp4');
    await run(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', '-movflags', '+faststart', rendered]);
    await Project.updateOne({ _id: project._id }, { status: 'quality_check', progress: 82 });

    const qc = await probe(rendered);
    const qcVideo = (qc.streams || []).find(stream => stream.codec_type === 'video');
    const outputDuration = Number(qc.format?.duration || 0);
    if (!qcVideo || outputDuration <= 0 || !Number(qcVideo.width) || !Number(qcVideo.height)) {
      throw Object.assign(new Error('Rendered output did not pass the media integrity check.'), { code: 'OUTPUT_QC_FAILED' });
    }
    const outputKey = 'projects/' + project._id + '/exports/' + Date.now() + '-vdyo-final.mp4';
    const uploaded = await uploadFile(outputKey, rendered);
    return { key: outputKey, size: uploaded.size, durationSeconds: outputDuration, width: Number(qcVideo.width), height: Number(qcVideo.height) };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const worker = new Worker('vdyo-video-jobs', async job => {
  const project = await Project.findById(job.data.projectId);
  if (!project) throw new Error('Project no longer exists.');
  try {
    project.status = 'analysing'; project.progress = 10; project.error = undefined; await project.save();
    const output = await renderProject(project, job);
    project.status = 'ready'; project.progress = 100; project.output = output;
    project.completedAt = new Date(); project.error = undefined;
    await project.save();
    return { projectId: project.id, outputKey: output.key };
  } catch (error) {
    project.status = 'failed';
    project.error = { code: error.code || 'RENDER_FAILED', message: error.message };
    await project.save();
    throw error;
  }
}, { connection, concurrency: Number(process.env.VIDEO_WORKER_CONCURRENCY || 1) });

worker.on('completed', job => console.log('[worker] completed', job.id));
worker.on('failed', (job, error) => console.error('[worker] failed', job?.id, error.message));
console.log('[worker] VDYO FFmpeg render worker is listening');

import { Router } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.js';
import { createUploadUrl, verifyUploadedObject, createDownloadUrl } from '../services/storage.js';
import { getVideoQueue } from '../queue.js';
import { createEditingBrief } from '../services/aiDirector.js';

const router = Router();
const createSchema = z.object({
  customer: z.object({ name: z.string().trim().min(1).max(100), email: z.string().email().optional() }),
  title: z.string().trim().min(2).max(140),
  format: z.enum(['reel','short','youtube','wedding','promo','custom']).default('reel'),
  aspectRatio: z.enum(['9:16','16:9','1:1','4:5']).default('9:16'),
  targetDurationSeconds: z.number().int().min(5).max(3600).default(30),
  style: z.string().max(1000).default('Dynamic, clean, platform-native'),
  instructions: z.string().max(5000).default('')
});
const uploadSchema = z.object({
  fileName: z.string().min(1).max(240),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive()
});
const allowedTypes = new Set(process.env.ALLOWED_UPLOAD_TYPES?.split(',') ?? ['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','audio/mpeg','audio/mp4']);

router.post('/', async (req, res) => {
  const input = createSchema.parse(req.body);
  const count = await Project.countDocuments();
  const project = await Project.create({ ...input, projectCode: `VD-${String(Date.now()).slice(-7)}`, status: 'awaiting_uploads' });
  res.status(201).json({ project });
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = req.query.status ? { status: req.query.status } : {};
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Project.countDocuments(filter)
  ]);
  res.json({ projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', async (req, res) => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
  const assets = await Promise.all((project.assets || []).map(async asset => ({
    ...asset, downloadUrl: asset.status === 'uploaded' ? await createDownloadUrl(asset.key).catch(() => null) : null
  })));
  res.json({ project: { ...project, assets } });
});

router.post('/:id/uploads', async (req, res) => {
  const input = uploadSchema.parse(req.body);
  if (!allowedTypes.has(input.mimeType)) return res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'This file type is not allowed.' } });
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024 * 1024);
  if (input.size > maxBytes) return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds the configured upload limit.' } });
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
  const signed = await createUploadUrl({ projectId: project.id, ...input });
  project.assets.push({ key: signed.key, originalName: input.fileName, mimeType: input.mimeType, size: input.size, status: 'pending' });
  await project.save();
  res.status(201).json(signed);
});

router.post('/:id/uploads/complete', async (req, res) => {
  const schema = z.object({ key: z.string().min(1) });
  const { key } = schema.parse(req.body);
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
  const asset = project.assets.find(item => item.key === key);
  if (!asset) return res.status(404).json({ error: { code: 'ASSET_NOT_FOUND', message: 'Upload was not registered for this project.' } });
  await verifyUploadedObject(key, asset.size);
  asset.status = 'uploaded';
  await project.save();
  res.json({ ok: true, assetId: asset.id });
});

router.post('/:id/process', async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
  if (!project.assets.some(asset => asset.status === 'uploaded')) return res.status(409).json({ error: { code: 'NO_UPLOADED_MEDIA', message: 'Upload at least one source file before processing.' } });
  const brief = await createEditingBrief(project, project.assets.filter(asset => asset.status === 'uploaded'));
  project.aiBrief = brief;
  project.status = 'queued';
  project.progress = 5;
  project.error = undefined;
  await project.save();
  const queue = getVideoQueue();
  const job = await queue.add('process-project', { projectId: project.id }, { jobId: project.id });
  res.status(202).json({ project, jobId: job.id });
});

export default router;

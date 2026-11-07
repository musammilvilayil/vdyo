import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { connectDatabase } from './db.js';
import healthRouter from './routes/health.js';
import projectsRouter from './routes/projects.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.WEB_ORIGIN.split(',').map(value => value.trim()), credentials: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.redirect(307, '/api/health/details'));
app.use('/api/health/details', healthRouter);
app.use('/api/projects', projectsRouter);

app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }));
app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted fields.', details: error.issues } });
  const status = Number(error.status) || 500;
  if (status >= 500) console.error('[api]', error);
  res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Something went wrong. Please try again.' : error.message } });
});

await connectDatabase().catch(error => {
  console.error('[db] MongoDB connection failed:', error.message);
  if (env.NODE_ENV === 'production') process.exit(1);
});
const server = app.listen(env.PORT, () => console.log(`VDYO API listening on :${env.PORT}`));

async function shutdown(signal) {
  console.log(`[api] ${signal} received; closing server`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

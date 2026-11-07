import { Router } from 'express';
import mongoose from 'mongoose';
import { hasAI, hasDatabase, hasQueue, hasStorage } from '../config/env.js';

const router = Router();
router.get('/', (_req, res) => res.json({
  ok: true,
  service: 'vdyo-api',
  dependencies: {
    database: { configured: hasDatabase, connected: mongoose.connection.readyState === 1 },
    queue: { configured: hasQueue },
    ai: { configured: hasAI },
    storage: { configured: hasStorage }
  },
  timestamp: new Date().toISOString()
}));
export default router;

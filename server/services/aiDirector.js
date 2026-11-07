import OpenAI from 'openai';
import { env, hasAI } from '../config/env.js';

const outputShape = {
  type: 'object',
  additionalProperties: false,
  properties: {
    creativeDirection: { type: 'string' },
    hook: { type: 'string' },
    targetDurationSeconds: { type: 'integer' },
    aspectRatio: { type: 'string', enum: ['9:16','16:9','1:1','4:5'] },
    musicMood: { type: 'string' },
    captionStyle: { type: 'string' },
    sequence: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
      purpose: { type: 'string' }, suggestedDurationSeconds: { type: 'integer' }, editingNotes: { type: 'string' }
    }, required: ['purpose','suggestedDurationSeconds','editingNotes'] } },
    qualityChecks: { type: 'array', items: { type: 'string' } }
  },
  required: ['creativeDirection','hook','targetDurationSeconds','aspectRatio','musicMood','captionStyle','sequence','qualityChecks']
};

export async function createEditingBrief(project, assets) {
  if (!hasAI) {
    return {
      mode: 'fallback',
      creativeDirection: project.style,
      hook: 'Open with the strongest visual moment.',
      targetDurationSeconds: project.targetDurationSeconds,
      aspectRatio: project.aspectRatio,
      musicMood: 'Match music to the selected style and licensed source.',
      captionStyle: 'High-contrast, mobile-readable captions.',
      sequence: [{ purpose: 'Hook', suggestedDurationSeconds: 3, editingNotes: 'Use the strongest opening shot.' }, { purpose: 'Main story', suggestedDurationSeconds: Math.max(2, project.targetDurationSeconds - 6), editingNotes: 'Build a coherent visual sequence.' }, { purpose: 'Closing', suggestedDurationSeconds: 3, editingNotes: 'Finish with a clear end frame.' }],
      qualityChecks: ['Check source media integrity', 'Check aspect ratio and safe areas', 'Check audio peaks and caption timing'],
      note: 'AI provider is not configured; generated a safe starter brief.'
    };
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.4,
    response_format: { type: 'json_schema', json_schema: { name: 'vdyo_editing_brief', strict: true, schema: outputShape } },
    messages: [
      { role: 'system', content: 'You are VDYO, a professional video editor and creative director. Produce a practical edit plan from the customer brief and file metadata. Do not claim to have visually inspected media unless visual analysis was actually supplied. Never recommend unlicensed copyrighted music.' },
      { role: 'user', content: JSON.stringify({ title: project.title, format: project.format, targetDurationSeconds: project.targetDurationSeconds, aspectRatio: project.aspectRatio, style: project.style, instructions: project.instructions, assets: assets.map(({ originalName, mimeType, size, durationSeconds }) => ({ originalName, mimeType, size, durationSeconds })) }) }
    ]
  });
  return { mode: 'ai', ...JSON.parse(response.choices[0].message.content) };
}

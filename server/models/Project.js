import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  key: { type: String, required: true },
  originalName: { type: String, required: true, maxlength: 240 },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true, min: 1 },
  role: { type: String, enum: ['source','logo','music','reference'], default: 'source' },
  status: { type: String, enum: ['pending','uploaded','failed'], default: 'pending' },
  durationSeconds: Number
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  projectCode: { type: String, unique: true, index: true },
  customer: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    userId: { type: String, index: true }
  },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  format: { type: String, enum: ['reel','short','youtube','wedding','promo','custom'], default: 'reel' },
  aspectRatio: { type: String, enum: ['9:16','16:9','1:1','4:5'], default: '9:16' },
  targetDurationSeconds: { type: Number, min: 5, max: 3600, default: 30 },
  style: { type: String, maxlength: 1000, default: 'Dynamic, clean, platform-native' },
  instructions: { type: String, maxlength: 5000, default: '' },
  status: { type: String, enum: ['draft','awaiting_uploads','queued','analysing','editing','rendering','quality_check','ready','failed','cancelled'], default: 'awaiting_uploads', index: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  assets: [assetSchema],
  aiBrief: { type: mongoose.Schema.Types.Mixed, default: null },
  output: { key: String, durationSeconds: Number, width: Number, height: Number, size: Number },
  error: { code: String, message: String },
  revisionCount: { type: Number, default: 0 },
  completedAt: Date
}, { timestamps: true });

projectSchema.index({ 'customer.userId': 1, createdAt: -1 });
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

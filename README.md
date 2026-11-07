# VDYO — AI Video Studio

VDYO is a **web-first AI video editing workspace**. Customers create projects, upload raw footage, describe the creative direction and request an AI-generated editing plan. WhatsApp is optional and is not part of the core workflow.

## Product workflow

1. Create a video project and select format, aspect ratio, duration and style.
2. Upload source footage, images, logos or audio to private object storage using short-lived signed URLs.
3. The AI Director turns the brief and available file metadata into a structured editing plan.
4. A background queue accepts the project for media analysis and rendering.
5. A video worker performs processing and quality checks before the project can be marked ready.
6. The customer previews, requests revisions and downloads the final export.

## Current implementation

- Responsive React/Vite web workspace with project creation, search, status overview and project detail drawer.
- Express API with health/dependency reporting, validation, rate limiting, security headers and CORS.
- MongoDB project and asset model.
- S3-compatible private storage adapter and signed upload/download URL flow.
- OpenAI-powered structured AI editing brief, with a safe fallback brief when no API key is configured.
- Redis/BullMQ queue foundation and a separate FFmpeg worker entrypoint.
- Production guard: project endpoints are disabled in production until authentication and tenant authorization are implemented.

**Important:** this is a development foundation, not a completed autonomous editor. The worker deliberately fails closed until the secure media download, visual analysis, edit-decision-list renderer and output quality-control pipeline are implemented. No finished video is fabricated or marked ready. Authentication, payments, customer-facing preview/revision delivery and production deployment are not yet implemented.

## Architecture

See [docs/architecture.md](docs/architecture.md) for system boundaries, lifecycle, API and security requirements.

## Local development

Requirements:
- Node.js 20+
- MongoDB
- Redis
- An S3-compatible bucket (Cloudflare R2 or AWS S3) for uploads
- FFmpeg installed on the worker host
- OpenAI API key for AI-generated briefs

Install and configure:

```bash
npm install
cp .env.example .env
```

Start the API, web app and worker in separate terminals:

```bash
npm run server
npm run dev
npm run worker
```

Vite proxies `/api` to `http://localhost:4000`. Configure MongoDB, Redis and private object storage in `.env`. The API can start without optional services, but project persistence, signed uploads, AI planning and background jobs require their corresponding service credentials.

## API

- `GET /api/health` — API and dependency status.
- `POST /api/projects` — create a project.
- `GET /api/projects` — list projects.
- `GET /api/projects/:id` — fetch project details.
- `POST /api/projects/:id/uploads` — request a signed upload URL.
- `POST /api/projects/:id/uploads/complete` — verify an uploaded object.
- `POST /api/projects/:id/process` — generate an AI brief and enqueue processing.

Project routes are available only in development until authentication and per-customer authorization are implemented. Do not deploy this scaffold as a public service.

## Roadmap

- [x] Replace WhatsApp-first dashboard with web-first studio UI
- [x] Project model and project management API
- [x] Signed private media upload foundation
- [x] Structured AI editing brief
- [x] Redis/BullMQ job queue foundation
- [x] Separate FFmpeg worker entrypoint with fail-safe behavior
- [ ] Customer authentication, sessions and tenant-level authorization
- [ ] Media probing, thumbnails and scene-level visual understanding
- [ ] Structured edit decision list (EDL) and deterministic FFmpeg renderer
- [ ] Automated quality checks and safe retry/recovery
- [ ] Preview playback, revisions and final delivery
- [ ] Payments, usage limits, audit logs and media deletion controls
- [ ] Production CI, monitoring, deployment and load testing

## Security notes

- Never expose provider credentials in browser code.
- Keep source media in private buckets; use short-lived signed URLs.
- Add authentication and tenant authorization before enabling project routes in production.
- Verify actual uploaded object metadata and content, not only the filename or browser MIME type.
- Isolate FFmpeg workers and enforce CPU, memory, duration and file-size quotas.
- Add malware scanning, retention/deletion controls, audit events and backups.
- Do not mark a project ready until an output file exists and passes automated QC.

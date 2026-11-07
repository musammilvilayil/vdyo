# VDYO — AI Video Studio

VDYO is a web-first AI video editing workspace. Customers create projects, upload raw footage, describe the creative direction and request an AI-generated editing plan. WhatsApp is optional and is not part of the core workflow.

## Product workflow

1. Create a video project and select format, aspect ratio, duration and style.
2. Upload source footage to private object storage using short-lived signed URLs.
3. The AI Director turns the brief and available file metadata into a structured editing plan.
4. Redis/BullMQ schedules a background render.
5. The FFmpeg worker downloads registered source clips, normalizes them to the requested aspect ratio, trims clips to a target segment length, concatenates them and probes the exported MP4.
6. Only after the MP4 is uploaded and passes basic stream/duration/dimension checks is the project marked ready.

## Implemented

- Responsive React/Vite studio dashboard with project creation, search, status overview and project detail drawer.
- Express API with validation, rate limiting, security headers, CORS and dependency health reporting.
- MongoDB project and asset model.
- S3-compatible private storage with signed browser uploads, verified upload sizes, worker downloads and final export uploads.
- OpenAI structured editing brief, with an explicit fallback when no API key is configured.
- Redis/BullMQ background queue.
- FFmpeg worker that creates a real MP4 montage from uploaded video clips, normalizes aspect ratio and audio, concatenates clips, performs output media checks and stores the final export.
- CI workflow that installs dependencies, builds the web app and checks backend JavaScript syntax.

## Honest feature boundaries

The renderer is a deterministic first-pass montage renderer, not a full creative AI editor. It does not yet understand scenes visually, rank moments, generate subtitles, select licensed music, add transitions or support image-only projects. The AI Director creates an edit brief from user instructions and file metadata; it does not claim to have watched the footage.

Clerk sign-in/sign-up is integrated in the web client. Express verifies Clerk sessions and scopes project reads/writes to the authenticated Clerk user. Production requires real Clerk keys, MongoDB, Redis, private object storage and an FFmpeg worker. Revision history, payments, usage limits, media retention/deletion controls, audit logs, observability and production deployment still require configuration and implementation.

## Local development

Requirements: Node.js 20+, MongoDB, Redis, an S3-compatible private bucket, and FFmpeg + FFprobe on the worker host.

\`\`\`bash
npm install
cp .env.example .env
npm run server
npm run dev
npm run worker
\`\`\`

Run the frontend and API in separate terminals; run the worker in a third terminal. Configure the environment variables in .env. The worker needs access to the same private object-storage bucket as the API.

## API

- GET /api/health — API and dependency status.
- POST /api/projects — create a project.
- GET /api/projects — paginated project list.
- GET /api/projects/:id — project, expiring source links and final export link.
- POST /api/projects/:id/uploads — create a signed upload URL.
- POST /api/projects/:id/uploads/complete — verify uploaded object size.
- POST /api/projects/:id/process — generate an editing brief and enqueue a render.

## Security before production

- Add authentication and tenant authorization before enabling project endpoints in production.
- Verify media content and checksums, not only browser MIME types.
- Keep source and export objects private; use short-lived signed URLs.
- Isolate FFmpeg workers and enforce CPU, memory, duration and file-size quotas.
- Add malware scanning, retention/deletion controls, audit events, backups, observability and load testing.
- Do not mark a project ready until an output object exists and passes output validation.

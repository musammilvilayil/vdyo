# VDYO — WhatsApp-first AI Video Studio

VDYO is a WhatsApp-first video editing studio. Customers request edits in WhatsApp; an AI studio manager collects requirements, organizes footage, coordinates automated editing workflows and returns previews for approval.

## Product direction

- WhatsApp is the primary customer interface.
- AI handles intake, briefs, status updates and supported repetitive editing tasks.
- FFmpeg-based processing handles reliable media operations.
- Human review remains available for creative and quality-critical work.
- Original customer media is stored privately; WhatsApp messages should carry links or supported media, not act as the long-term asset store.

## Current implementation

- Responsive React/Vite studio dashboard.
- Overview metrics, recent orders, searchable order list and create-order interaction.
- WhatsApp inbox preview with local demo conversation.
- Express API health endpoint.
- WhatsApp Cloud API webhook verification and event acknowledgement scaffold.
- Environment variable template.

**The dashboard currently uses demo data.** WhatsApp, AI, database, storage, payment and actual video rendering integrations are not connected yet.

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Run the API separately:

```bash
cp .env.example .env
npm run server
```

API health: `http://localhost:4000/api/health`

## Planned architecture

1. WhatsApp Cloud API — inbound messages, media references and approved outbound templates.
2. Express API — webhook validation, customer identity and order endpoints.
3. AI orchestration — intent detection, structured editing brief, clarification and tool selection.
4. MongoDB — customers, conversations, orders, assets, jobs and audit events.
5. Private object storage — raw footage, previews and final exports.
6. FFmpeg workers — trim, concat, crop, resize, normalize audio, subtitles and export.
7. Human review — approval gates for creative edits and final delivery.
8. Payment gateway — server-side payment verification and order state transitions.

## Safety and reliability

- Never expose provider tokens in the browser.
- Verify WhatsApp webhook signatures before processing production events.
- Treat incoming text, files and links as untrusted input.
- Use signed, expiring upload/download URLs for customer media.
- Verify payment status from gateway webhooks, not screenshots.
- Keep human approval for edits that cannot be reliably evaluated automatically.
- Apply a documented retention and deletion policy to customer footage.

## Roadmap

- [x] Initial responsive dashboard and demo order interactions
- [x] Express health endpoint and WhatsApp webhook scaffold
- [ ] Persist customers, chats and orders in MongoDB
- [ ] Connect WhatsApp Cloud API and inbound media handling
- [ ] Add AI brief generation and conversation state
- [ ] Add secure upload and asset management
- [ ] Add FFmpeg job queue and worker
- [ ] Add preview approval, revisions and delivery
- [ ] Add payment integration and production observability

## Important

This is an early scaffold, not a production-ready autonomous editing service. Real credentials, webhook signature verification, storage, job processing, tests and deployment configuration are still required.

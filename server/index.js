import express from 'express';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'vdyo-api', status: 'scaffolded' });
});

// Meta WhatsApp Cloud API webhook verification.
// Set WHATSAPP_VERIFY_TOKEN before connecting a WhatsApp app.
app.get('/api/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming events are acknowledged immediately. Message processing will be
// connected to the AI orchestration pipeline in the next implementation phase.
app.post('/api/webhooks/whatsapp', (req, res) => {
  res.sendStatus(200);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`VDYO API listening on :${port}`));

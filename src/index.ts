import express from 'express';

const app = express();
app.use(express.json());

interface IdempotencyRecord {
  key: string;
  response: any;
  statusCode: number;
  createdAt: Date;
}

// In-memory store (use Redis in production)
const store = new Map<string, IdempotencyRecord>();

// Check idempotency
app.post('/check', (req, res) => {
  const { idempotencyKey } = req.body;
  
  if (store.has(idempotencyKey)) {
    const record = store.get(idempotencyKey)!;
    return res.status(record.statusCode).json(record.response);
  }
  
  return res.status(404).json({ exists: false });
});

// Store result
app.post('/store', (req, res) => {
  const { idempotencyKey, response, statusCode } = req.body;
  store.set(idempotencyKey, {
    key: idempotencyKey,
    response,
    statusCode,
    createdAt: new Date()
  });
  return res.json({ stored: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', records: store.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Idempotency service running on ${PORT}`));

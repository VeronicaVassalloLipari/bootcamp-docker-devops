// mock-api/src/index.js
const fs = require('fs');
const express = require('express');
const Redis = require('ioredis');

const app = express();
const port = process.env.PORT || 80;
const dataFile = process.env.DATA_FILE || '/data/db.json';
const ttl = Number(process.env.CACHE_TTL || 30);

const redis = new Redis(process.env.REDIS_URL, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  commandTimeout: 500,
});
redis.on('error', () => {});

app.get('/healthz', async (req, res) => {
  let cache = 'up';
  try {
    await redis.ping();
  } catch (err) {
    cache = 'down';
  }
  res.json({ status: 'ok', cache });
});

app.get('/:resource', async (req, res) => {
  const key = `mock:${req.params.resource}`;
  try {
    const cached = await redis.get(key);
    if (cached !== null) return res.set('X-Cache', 'HIT').type('json').send(cached);
  } catch (err) {
    // cache non disponibile: legge i dati e risponde lo stesso
  }

  let body;
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    if (!(req.params.resource in data)) {
      return res.status(404).json({ error: `Resource '${req.params.resource}' not found` });
    }
    body = JSON.stringify(data[req.params.resource]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  let source = 'BYPASS';
  try {
    await redis.setex(key, ttl, body);
    source = 'MISS';
  } catch (err) {
    // resta BYPASS: la risposta è giusta, solo non finisce in cache
  }
  res.set('X-Cache', source).type('json').send(body);
});

let server;
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    redis.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 9000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server = app.listen(port, () => {
  console.log(`Mock API listening on port ${port}`);
});

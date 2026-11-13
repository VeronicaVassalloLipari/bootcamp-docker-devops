import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({ app: 'demo-node-app' });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

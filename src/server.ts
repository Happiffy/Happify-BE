import express from 'express';

const app = express();

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.listen(process.env.PORT ?? 4000);

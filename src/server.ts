import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import analyticsRoutes from '@/modules/analytics/analytics.routes.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import communityRoutes from '@/modules/community/community.routes.js';
import heatmapRoutes from '@/modules/heatmap/heatmap.routes.js';
import journalRoutes from '@/modules/journal/journal.routes.js';
import mediaRoutes from '@/modules/media/media.routes.js';
import moodRoutes from '@/modules/mood/mood.routes.js';
import preferenceRoutes from '@/modules/preference/preference.routes.js';
import profileRoutes from '@/modules/profile/profile.routes.js';
import referralRoutes from '@/modules/referral/referral.routes.js';
import { attachRealtimeServer } from '@/modules/realtime/realtime.js';

const port = Number(process.env.PORT ?? 4000);
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '8mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_request, response) => response.json({ status: 'healthy', service: 'BE-Happify' }));

app.use('/analytics', analyticsRoutes);
app.use('/auth', authRoutes);
app.use('/mood', moodRoutes);
app.use('/journal', journalRoutes);
app.use('/media', mediaRoutes);
app.use('/community', communityRoutes);
app.use('/heatmap', heatmapRoutes);
app.use('/referral', referralRoutes);
app.use('/preferences', preferenceRoutes);
app.use('/profile', profileRoutes);

app.use((_request, response) => {
  response.status(404).json({ status: 'error', message: 'Route not found' });
});

const server = createServer(app);
attachRealtimeServer(server);

server.listen(port, '0.0.0.0', () => {
  console.log(`BE-Happify running on http://localhost:${port}`);
});

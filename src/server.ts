import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import analyticsRoutes from '@/modules/analytics/analytics.routes.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import consentRoutes from '@/modules/consent/consent.routes.js';
import emergencyContactRoutes from '@/modules/emergency-contact/emergency-contact.routes.js';
import communityRoutes from '@/modules/community/community.routes.js';
import deviceRoutes from '@/modules/device/device.routes.js';
import heatmapRoutes from '@/modules/heatmap/heatmap.routes.js';
import journalRoutes from '@/modules/journal/journal.routes.js';
import mediaRoutes from '@/modules/media/media.routes.js';
import mindfulnessRoutes from '@/modules/mindfulness/mindfulness.routes.js';
import moodRoutes from '@/modules/mood/mood.routes.js';
import motivationRoutes from '@/modules/motivation/motivation.routes.js';
import notificationRoutes from '@/modules/notification/notification.routes.js';
import preferenceRoutes from '@/modules/preference/preference.routes.js';
import profileRoutes from '@/modules/profile/profile.routes.js';
import providerRoutes from '@/modules/provider/provider.routes.js';
import referralRoutes from '@/modules/referral/referral.routes.js';
import simulatorRoutes from '@/modules/device/device.simulator.routes.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import { attachRealtimeServer } from '@/modules/realtime/realtime.js';
import voiceRoutes from '@/modules/voice/voice.routes.js';

const port = Number(process.env.PORT ?? 4000);
const app = express();
const allowedOrigins = new Set((process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), credentials: true }));
app.use('/voice', voiceRoutes);
app.use(express.json({ limit: '8mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_request, response) => response.json({ status: 'healthy', service: 'BE-Happify' }));

app.use('/analytics', analyticsRoutes);
app.use('/auth', authRoutes);
app.use('/consents', consentRoutes);
app.use('/emergency-contacts', emergencyContactRoutes);
app.use('/mindfulness', mindfulnessRoutes);
app.use('/motivation', motivationRoutes);
app.use('/providers', providerRoutes);
if (process.env.ENABLE_SIMULATOR_ROUTES === 'true') app.use('/simulator', requireAuth, simulatorRoutes);
app.use('/mood', moodRoutes);
app.use('/journal', journalRoutes);
app.use('/media', mediaRoutes);
app.use('/community', communityRoutes);
app.use('/devices', deviceRoutes);
app.use('/heatmap', heatmapRoutes);
app.use('/referral', referralRoutes);
app.use('/notifications', notificationRoutes);
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

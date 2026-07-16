import { Router, raw } from 'express';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import voiceController from '@/modules/voice/voice.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/turns', voiceController.list.bind(voiceController));
router.post('/turns', raw({ type: ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg'], limit: process.env.VOICE_MAX_AUDIO_BYTES ?? '6mb' }), voiceController.process.bind(voiceController));
router.get('/turns/:turnId/audio', voiceController.audio.bind(voiceController));

export default router;

import { Router } from 'express';
import { requireAuth, requireRole } from '@/modules/auth/auth.middleware.js';
import referralController from '@/modules/referral/referral.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', referralController.list.bind(referralController));
router.post('/', referralController.create.bind(referralController));
router.get('/chats', referralController.listChats.bind(referralController));
router.get('/chats/:sessionId', referralController.getChat.bind(referralController));
router.patch('/chats/:sessionId/status', referralController.updateChatStatus.bind(referralController));
router.post('/chats/:sessionId/messages', referralController.createChatMessage.bind(referralController));
router.patch('/:id/review', requireRole('PSYCHOLOGIST'), referralController.review.bind(referralController));

export default router;

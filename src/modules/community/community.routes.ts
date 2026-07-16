import { Router } from 'express';
import communityController from '@/modules/community/community.controller.js';
import { requireAuth, requireRole } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', communityController.list.bind(communityController));
router.post('/', communityController.create.bind(communityController));
router.post('/:id/comments', communityController.comment.bind(communityController));
router.post('/:id/support', communityController.support.bind(communityController));
router.post('/reports', communityController.report.bind(communityController));
router.get('/reports', requireRole('MODERATOR', 'ADMIN'), communityController.listReports.bind(communityController));
router.post('/moderation', requireRole('MODERATOR', 'ADMIN'), communityController.moderate.bind(communityController));

export default router;

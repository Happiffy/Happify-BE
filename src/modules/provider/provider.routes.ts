import { Router } from 'express';
import { requireAuth, requireRole } from '@/modules/auth/auth.middleware.js';
import controller from '@/modules/provider/provider.controller.js';
const router = Router();
router.use(requireAuth);
router.get('/', controller.list.bind(controller));
router.post('/', requireRole('ADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('ADMIN'), controller.update.bind(controller));
export default router;

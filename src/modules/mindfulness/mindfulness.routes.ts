import { Router } from 'express';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import mindfulnessController from '@/modules/mindfulness/mindfulness.controller.js';
const router = Router();
router.use(requireAuth);
router.get('/', mindfulnessController.list.bind(mindfulnessController));
router.put('/progress', mindfulnessController.progress.bind(mindfulnessController));
export default router;

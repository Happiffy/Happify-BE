import { Router } from 'express';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import motivationController from '@/modules/motivation/motivation.controller.js';
const router = Router();
router.use(requireAuth);
router.get('/today', motivationController.today.bind(motivationController));
export default router;

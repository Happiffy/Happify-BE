import { Router } from 'express';
import analyticsController from '@/modules/analytics/analytics.controller.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', analyticsController.dashboard.bind(analyticsController));

export default router;

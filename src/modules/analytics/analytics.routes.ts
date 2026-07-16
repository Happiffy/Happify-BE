import { Router } from 'express';
import analyticsController from '@/modules/analytics/analytics.controller.js';

const router = Router();

router.get('/dashboard', analyticsController.dashboard.bind(analyticsController));

export default router;

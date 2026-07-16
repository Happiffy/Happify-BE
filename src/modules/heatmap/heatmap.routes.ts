import { Router } from 'express';
import heatmapController from '@/modules/heatmap/heatmap.controller.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', heatmapController.list.bind(heatmapController));
router.put('/contribution', heatmapController.contribute.bind(heatmapController));

export default router;

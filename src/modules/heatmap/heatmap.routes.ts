import { Router } from 'express';
import heatmapController from '@/modules/heatmap/heatmap.controller.js';

const router = Router();

router.get('/', heatmapController.list.bind(heatmapController));

export default router;

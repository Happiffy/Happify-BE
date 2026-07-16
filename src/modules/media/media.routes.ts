import { Router } from 'express';
import mediaController from '@/modules/media/media.controller.js';

const router = Router();

router.post('/images', mediaController.uploadImage.bind(mediaController));
router.get('/images/:key', mediaController.getImage.bind(mediaController));

export default router;

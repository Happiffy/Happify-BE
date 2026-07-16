import { Router } from 'express';
import mediaController from '@/modules/media/media.controller.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.post('/images', mediaController.uploadImage.bind(mediaController));
router.get('/images/:key', mediaController.getImage.bind(mediaController));

export default router;

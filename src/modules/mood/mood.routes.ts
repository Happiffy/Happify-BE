import { Router } from 'express';
import moodController from '@/modules/mood/mood.controller.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', moodController.list.bind(moodController));
router.post('/', moodController.create.bind(moodController));

export default router;

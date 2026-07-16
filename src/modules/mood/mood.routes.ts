import { Router } from 'express';
import moodController from '@/modules/mood/mood.controller.js';

const router = Router();

router.get('/', moodController.list.bind(moodController));
router.post('/', moodController.create.bind(moodController));

export default router;

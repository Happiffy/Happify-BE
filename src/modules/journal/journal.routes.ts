import { Router } from 'express';
import journalController from '@/modules/journal/journal.controller.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', journalController.list.bind(journalController));
router.post('/', journalController.create.bind(journalController));

export default router;

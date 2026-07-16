import { Router } from 'express';
import journalController from '@/modules/journal/journal.controller.js';

const router = Router();

router.get('/', journalController.list.bind(journalController));
router.post('/', journalController.create.bind(journalController));

export default router;

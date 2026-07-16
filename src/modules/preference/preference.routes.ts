import { Router } from 'express';
import preferenceController from '@/modules/preference/preference.controller.js';

const router = Router();

router.get('/', preferenceController.getByUserId.bind(preferenceController));
router.put('/', preferenceController.upsert.bind(preferenceController));

export default router;

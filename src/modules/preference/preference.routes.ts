import { Router } from 'express';
import preferenceController from '@/modules/preference/preference.controller.js';
import { requireAuth } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', preferenceController.getByUserId.bind(preferenceController));
router.put('/', preferenceController.upsert.bind(preferenceController));

export default router;

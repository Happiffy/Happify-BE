import { Router } from 'express';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import consentController from '@/modules/consent/consent.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', consentController.list.bind(consentController));
router.put('/', consentController.update.bind(consentController));
export default router;

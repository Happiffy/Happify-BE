import { Router } from 'express';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import notificationController from '@/modules/notification/notification.controller.js';

const router = Router();

router.use(requireAuth);
router.put('/tokens', notificationController.register.bind(notificationController));
router.delete('/tokens', notificationController.remove.bind(notificationController));

export default router;

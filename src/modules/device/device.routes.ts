import { Router } from 'express';
import { requireAuth } from '@/modules/auth/auth.middleware.js';
import deviceController from '@/modules/device/device.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', deviceController.list.bind(deviceController));
router.post('/pairing-sessions', deviceController.startPairing.bind(deviceController));
router.get('/pairing-sessions/:id', deviceController.getPairing.bind(deviceController));
router.post('/pairing-sessions/:id/complete', deviceController.completePairing.bind(deviceController));
router.delete('/pairing-sessions/:id', deviceController.cancelPairing.bind(deviceController));
router.get('/:id', deviceController.get.bind(deviceController));
router.patch('/:id', deviceController.update.bind(deviceController));

export default router;

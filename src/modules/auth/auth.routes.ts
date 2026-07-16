import { Router } from 'express';
import authController from '@/modules/auth/auth.controller.js';

const router = Router();

router.post('/verify', authController.verify.bind(authController));

export default router;

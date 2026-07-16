import { Router } from 'express';
import profileController from '@/modules/profile/profile.controller.js';
import { requireAuth, requireRole } from '@/modules/auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', profileController.getProfile.bind(profileController));
router.patch('/', profileController.updateProfile.bind(profileController));
router.post('/psychologist-applications', profileController.applyPsychologist.bind(profileController));
router.get('/psychologist-applications', requireRole('ADMIN'), profileController.listApplications.bind(profileController));
router.patch('/psychologist-applications/:id/review', requireRole('ADMIN'), profileController.reviewApplication.bind(profileController));

export default router;

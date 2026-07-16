import { Router } from 'express';
import profileController from '@/modules/profile/profile.controller.js';

const router = Router();

router.get('/', profileController.getProfile.bind(profileController));
router.patch('/', profileController.updateProfile.bind(profileController));
router.post('/psychologist-applications', profileController.applyPsychologist.bind(profileController));
router.get('/psychologist-applications', profileController.listApplications.bind(profileController));
router.patch('/psychologist-applications/:id/review', profileController.reviewApplication.bind(profileController));

export default router;

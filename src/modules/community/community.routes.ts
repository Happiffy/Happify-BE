import { Router } from 'express';
import communityController from '@/modules/community/community.controller.js';

const router = Router();

router.get('/', communityController.list.bind(communityController));
router.post('/', communityController.create.bind(communityController));
router.post('/:id/comments', communityController.comment.bind(communityController));
router.post('/:id/support', communityController.support.bind(communityController));

export default router;

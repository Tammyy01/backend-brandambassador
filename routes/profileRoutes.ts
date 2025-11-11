import express from 'express';
import { ProfileController } from '../controllers/profileController';

const router = express.Router();

// Profile completion routes
router.post('/applications/:applicationId/complete-profile', ProfileController.completeProfile);
router.get('/applications/:applicationId/profile', ProfileController.getProfile);
router.get('/applications/:applicationId/profile/completion', ProfileController.checkProfileCompletion);
router.patch('/applications/:applicationId/profile', ProfileController.updateProfile);

export default router;
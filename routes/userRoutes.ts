import express from 'express';
import { UserController } from '../controllers/userController';
import { uploadVideo as upload } from '../config/upload';

const router = express.Router();

// Video serving (Must be before /:userId to avoid conflict)
router.get('/uploads/videos/:filename', UserController.serveVideo);

// User creation and progress
router.post('/', UserController.createUser);
router.get('/:userId', UserController.getUser);

// Video upload
router.post('/:userId/video', upload.single('video'), UserController.uploadVideo);
router.post('/:userId/video-path', UserController.uploadVideoFromPath); // For iOS file paths

// Phone verification
router.post('/:userId/phone', UserController.addPhoneNumber);
router.post('/:userId/phone/otp', UserController.requestPhoneOTP);
router.post('/:userId/phone/verify', UserController.verifyPhoneOTP);

// Email verification
router.post('/:userId/email', UserController.addEmailAddress);
router.post('/:userId/email/otp', UserController.requestEmailOTP);
router.post('/:userId/email/verify', UserController.verifyEmailOTP);

// Completion and Submission
router.get('/:userId/check-completion', UserController.checkCompletion);
router.post('/:userId/submit', UserController.submitApplication);

// Profile Management (Merged from profileRoutes)
router.post('/:userId/profile', UserController.completeProfile);
router.get('/:userId/profile', UserController.getProfile);
router.put('/:userId/profile', UserController.updateProfile);
router.get('/:userId/profile/check', UserController.checkProfileCompletion);



export default router;

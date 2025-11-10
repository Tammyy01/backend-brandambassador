import express from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { uploadVideo } from '../config/upload';

const router = express.Router();

// Application flow routes
router.post('/applications', ApplicationController.createApplication);
router.get('/applications/:applicationId', ApplicationController.getApplication);
router.get('/applications/:applicationId/completion', ApplicationController.checkCompletion);

// Video upload route
router.patch(
  '/applications/:applicationId/video', 
  uploadVideo.single('video'),
  ApplicationController.uploadVideo
);

router.post(
  '/applications/:applicationId/video', 
  uploadVideo.single('video'),
  ApplicationController.uploadVideo
);

// Phone verification routes
router.patch('/applications/:applicationId/phone', ApplicationController.addPhoneNumber);
router.post('/applications/:applicationId/phone/request-otp', ApplicationController.requestPhoneOTP);
router.post('/applications/:applicationId/phone/verify-otp', ApplicationController.verifyPhoneOTP);

// Email verification routes
router.patch('/applications/:applicationId/email', ApplicationController.addEmailAddress);
router.post('/applications/:applicationId/email/request-otp', ApplicationController.requestEmailOTP);
router.post('/applications/:applicationId/email/verify-otp', ApplicationController.verifyEmailOTP);

// Submit application
router.post('/applications/:applicationId/submit', ApplicationController.submitApplication);

// Video serving route
router.get('/uploads/videos/:filename', ApplicationController.serveVideo);

// Add this route to your application routes
router.post('applications/:applicationId/upload-video-path', ApplicationController.uploadVideoFromPath);
export default router;
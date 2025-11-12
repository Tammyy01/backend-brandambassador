import express from 'express';
import { LoginController } from '../controllers/loginController';

const router = express.Router();

// Login routes
router.post('/login/request-otp', LoginController.requestLoginOTP);
router.post('/login/verify-otp', LoginController.verifyLoginOTP);
router.post('/login/check-phone', LoginController.checkPhoneExists);

export default router;
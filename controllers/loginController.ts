import { Request, Response } from 'express';
import User from '../models/User';
import {
  sendSuccessResponse,
  sendBadRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse
} from '../helpers/responses/httpResponses';
import { sendSMSOTP } from '../services/smsService';
import { createOTP, verifyOTP, canResendOTP } from '../services/otpService';

export class LoginController {
  // Request OTP for login
  static async requestLoginOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { phone } = req.body;

      if (!phone) {
        return sendBadRequestResponse(res, 'Phone number is required');
      }

      console.log(`🔐 Login OTP requested for phone: ${phone}`);

      // Check if phone number exists in a completed user application
      const user = await User.findOne({
        phone: phone,
        status: 'submitted', // Application must be submitted
        phoneVerified: true // Phone must be verified
      });

      if (!user) {
        console.log(`❌ No completed application found for phone: ${phone}`);
        return sendNotFoundResponse(res, 'No account found with this phone number. Please complete the ambassador application first.');
      }

      // Check if user has completed profile
      if (!user.isProfileCompleted) {
        console.log(`❌ Profile not completed for user: ${user._id}`);
        return sendBadRequestResponse(res, 'Please complete your profile before logging in.');
      }

      console.log(`✅ Valid user found for login: ${phone}, user: ${user._id}`);

      // Check if we can resend OTP
      const resendCheck = await canResendOTP(user._id!.toString(), 'phone');
      if (!resendCheck.canResend) {
        return sendBadRequestResponse(res, `Please wait ${resendCheck.waitTime} seconds before requesting a new OTP`);
      }

      // Generate and save OTP (reusing the same OTP service)
      const otpResult = await createOTP(user._id!.toString(), 'phone');
      if (otpResult.error) {
        return sendServerErrorResponse(res, 'Failed to generate OTP');
      }

      // Send SMS OTP
      const smsResult = await sendSMSOTP(phone, otpResult.otp);
      if (!smsResult.success) {
        return sendServerErrorResponse(res, smsResult.error || 'Failed to send SMS OTP');
      }

      console.log(`✅ Login OTP sent to: ${phone}`);

      return sendSuccessResponse(res, 'OTP sent to your phone number', {
        userId: user._id,
        phone: phone
      });
    } catch (error: any) {
      console.error('❌ Request login OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to send OTP: ' + error.message);
    }
  }

  // Verify OTP for login
  static async verifyLoginOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return sendBadRequestResponse(res, 'Phone number and OTP are required');
      }

      console.log(`🔐 Verifying login OTP for phone: ${phone}`);

      // Find the user by phone number
      const user = await User.findOne({
        phone: phone,
        status: 'submitted',
        phoneVerified: true
      });

      if (!user) {
        return sendNotFoundResponse(res, 'No account found with this phone number');
      }

      // Verify OTP using existing service
      const verificationResult = await verifyOTP(user._id!.toString(), 'phone', otp);
      if (!verificationResult.success) {
        return sendBadRequestResponse(res, verificationResult.error || 'Invalid OTP');
      }

      console.log(`✅ Login successful for: ${phone}, user: ${user.name}`);

      return sendSuccessResponse(res, 'Login successful', {
        loginSuccess: true,
        userProfile: {
          id: user._id,
          name: user.name,
          email: user.email,
          linkedinUrl: user.linkedinUrl,
          profileImage: user.profileImage,
          qrCodeData: user.qrCodeData,
          isProfileCompleted: user.isProfileCompleted
        },
        userId: user._id
      });
    } catch (error: any) {
      console.error('❌ Verify login OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to verify OTP: ' + error.message);
    }
  }

  // Check if phone number exists in system
  static async checkPhoneExists(req: Request, res: Response): Promise<Response> {
    try {
      const { phone } = req.body;

      if (!phone) {
        return sendBadRequestResponse(res, 'Phone number is required');
      }

      const user = await User.findOne({
        phone: phone,
        status: 'submitted',
        phoneVerified: true
      });

      if (!user) {
        return sendSuccessResponse(res, 'Phone number not found', {
          exists: false
        });
      }

      const canLogin = user.isProfileCompleted;

      return sendSuccessResponse(res, 'Phone number check completed', {
        exists: true,
        canLogin: canLogin,
        userId: user._id,
        profileCompleted: canLogin
      });
    } catch (error: any) {
      console.error('❌ Check phone exists error:', error);
      return sendServerErrorResponse(res, 'Failed to check phone number: ' + error.message);
    }
  }
}
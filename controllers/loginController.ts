import { Request, Response } from 'express';
import AmbassadorApplication from '../models/AmbassadorApplication';
import UserProfile from '../models/UserProfile';
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

      // Check if phone number exists in a completed application
      const application = await AmbassadorApplication.findOne({
        phone: phone,
        status: 'submitted', // Application must be submitted
        phoneVerified: true // Phone must be verified
      });

      if (!application) {
        console.log(`❌ No completed application found for phone: ${phone}`);
        return sendNotFoundResponse(res, 'No account found with this phone number. Please complete the ambassador application first.');
      }

      // Check if user has completed profile
      const userProfile = await UserProfile.findOne({ 
        applicationId: application._id 
      });

      if (!userProfile || !userProfile.isProfileCompleted) {
        console.log(`❌ Profile not completed for application: ${application._id}`);
        return sendBadRequestResponse(res, 'Please complete your profile before logging in.');
      }

      console.log(`✅ Valid user found for login: ${phone}, application: ${application._id}`);

      // Check if we can resend OTP
      const resendCheck = await canResendOTP(application._id!.toString(), 'phone');
      if (!resendCheck.canResend) {
        return sendBadRequestResponse(res, `Please wait ${resendCheck.waitTime} seconds before requesting a new OTP`);
      }

      // Generate and save OTP (reusing the same OTP service)
      const otpResult = await createOTP(application._id!.toString(), 'phone');
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
        applicationId: application._id,
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

      // Find the application by phone number
      const application = await AmbassadorApplication.findOne({
        phone: phone,
        status: 'submitted',
        phoneVerified: true
      });

      if (!application) {
        return sendNotFoundResponse(res, 'No account found with this phone number');
      }

      // Verify OTP using existing service
      const verificationResult = await verifyOTP(application._id!.toString(), 'phone', otp);
      if (!verificationResult.success) {
        return sendBadRequestResponse(res, verificationResult.error || 'Invalid OTP');
      }

      // Get user profile
      const userProfile = await UserProfile.findOne({ 
        applicationId: application._id 
      });

      if (!userProfile) {
        return sendNotFoundResponse(res, 'User profile not found');
      }

      console.log(`✅ Login successful for: ${phone}, user: ${userProfile.name}`);

      return sendSuccessResponse(res, 'Login successful', {
        loginSuccess: true,
        userProfile: {
          id: userProfile._id,
          name: userProfile.name,
          email: userProfile.email,
          linkedinUrl: userProfile.linkedinUrl,
          profileImage: userProfile.profileImage,
          qrCodeData: userProfile.qrCodeData,
          isProfileCompleted: userProfile.isProfileCompleted
        },
        applicationId: application._id
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

      const application = await AmbassadorApplication.findOne({
        phone: phone,
        status: 'submitted',
        phoneVerified: true
      });

      if (!application) {
        return sendSuccessResponse(res, 'Phone number not found', {
          exists: false
        });
      }

      // Check if profile is completed
      const userProfile = await UserProfile.findOne({ 
        applicationId: application._id 
      });

      const canLogin = userProfile && userProfile.isProfileCompleted;

      return sendSuccessResponse(res, 'Phone number check completed', {
        exists: true,
        canLogin: canLogin,
        applicationId: application._id,
        profileCompleted: canLogin
      });
    } catch (error: any) {
      console.error('❌ Check phone exists error:', error);
      return sendServerErrorResponse(res, 'Failed to check phone number: ' + error.message);
    }
  }
}
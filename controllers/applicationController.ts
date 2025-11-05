import { Request, Response } from 'express';
import AmbassadorApplication from '../models/AmbassadorApplication';
import {
  sendSuccessResponse,
  sendBadRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse
} from '../helpers/responses/httpResponses';
import { getVideoUrl } from '../config/upload';
import { sendEmailOTP } from '../services/emailService';
import { sendSMSOTP } from '../services/smsService';
import { createOTP, verifyOTP, canResendOTP } from '../services/otpService';
import fs from 'fs';
import path from 'path';

export class ApplicationController {
  // Create new empty application (when user clicks "Apply to be an Ambassador")
  static async createApplication(req: Request, res: Response): Promise<Response> {
    try {
      const application = await AmbassadorApplication.create({
        progress: {
          video: false,
          phone: false,
          email: false
        },
        status: 'draft'
      });

      console.log(`✅ New application created: ${application._id}`);

      return sendSuccessResponse(
        res, 
        'Application started successfully', 
        { 
          applicationId: application._id,
          progress: application.progress
        }
      );
    } catch (error: any) {
      console.error('❌ Create application error:', error);
      return sendServerErrorResponse(res, 'Failed to create application: ' + error.message);
    }
  }

  // Get application progress
  static async getApplication(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      
      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      return sendSuccessResponse(res, 'Application retrieved', {
        applicationId: application._id,
        progress: application.progress,
        videoUploaded: application.videoUploaded,
        phoneVerified: application.phoneVerified,
        emailVerified: application.emailVerified,
        status: application.status
      });
    } catch (error: any) {
      console.error('❌ Get application error:', error);
      return sendServerErrorResponse(res, 'Failed to retrieve application: ' + error.message);
    }
  }

  // Handle video upload (from VideoRecording screen)
  static async uploadVideo(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      
      if (!req.file) {
        return sendBadRequestResponse(res, 'No video file uploaded');
      }

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        // Clean up uploaded file if application not found
        fs.unlinkSync(req.file.path);
        return sendNotFoundResponse(res, 'Application not found');
      }

      // Update application with video info
      application.videoFilename = req.file.filename;
      application.videoUrl = getVideoUrl(req.file.filename);
      application.videoUploaded = true;
      application.videoReviewStatus = 'pending';
      application.progress.video = true;
      await application.save();

      console.log(`✅ Video uploaded for application: ${applicationId}`);

      return sendSuccessResponse(res, 'Video uploaded successfully', {
        videoUploaded: true,
        progress: application.progress
      });
    } catch (error: any) {
      console.error('❌ Video upload error:', error);
      // Clean up file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return sendServerErrorResponse(res, 'Failed to upload video: ' + error.message);
    }
  }

  // Add phone number (from AddPhone screen)
  static async addPhoneNumber(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      const { phone } = req.body;

      if (!phone) {
        return sendBadRequestResponse(res, 'Phone number is required');
      }

      // Validate phone format (international format)
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return sendBadRequestResponse(res, 'Invalid phone number format');
      }

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      // Update phone number
      application.phone = phone;
      await application.save();

      console.log(`✅ Phone number added for application: ${applicationId}`);

      return sendSuccessResponse(res, 'Phone number added successfully', {
        phone: application.phone,
        progress: application.progress
      });
    } catch (error: any) {
      console.error('❌ Add phone number error:', error);
      return sendServerErrorResponse(res, 'Failed to add phone number: ' + error.message);
    }
  }

  // Request Phone OTP (from ApplyVerifyCode screen)
  static async requestPhoneOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      if (!application.phone) {
        return sendBadRequestResponse(res, 'Please add a phone number first');
      }

      // Check if we can resend OTP
      const resendCheck = await canResendOTP(applicationId, 'phone');
      if (!resendCheck.canResend) {
        return sendBadRequestResponse(res, `Please wait ${resendCheck.waitTime} seconds before requesting a new OTP`);
      }

      // Generate and save OTP
      const otpResult = await createOTP(applicationId, 'phone');
      if (otpResult.error) {
        return sendServerErrorResponse(res, 'Failed to generate OTP');
      }

      // Send SMS OTP
      const smsResult = await sendSMSOTP(application.phone, otpResult.otp);
      if (!smsResult.success) {
        return sendServerErrorResponse(res, smsResult.error || 'Failed to send SMS OTP');
      }

      console.log(`✅ Phone OTP sent for application: ${applicationId}`);

      return sendSuccessResponse(res, 'OTP sent to your phone number');
    } catch (error: any) {
      console.error('❌ Request phone OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to send OTP: ' + error.message);
    }
  }

  // Verify Phone OTP (from ApplyVerifyCode screen)
  static async verifyPhoneOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        return sendBadRequestResponse(res, 'OTP is required');
      }

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      // Verify OTP
      const verificationResult = await verifyOTP(applicationId, 'phone', otp);
      if (!verificationResult.success) {
        return sendBadRequestResponse(res, verificationResult.error || 'Invalid OTP');
      }

      // Update application
      application.phoneVerified = true;
      application.progress.phone = true;
      await application.save();

      console.log(`✅ Phone verified for application: ${applicationId}`);

      return sendSuccessResponse(res, 'Phone number verified successfully', {
        phoneVerified: true,
        progress: application.progress
      });
    } catch (error: any) {
      console.error('❌ Verify phone OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to verify OTP: ' + error.message);
    }
  }

  // Add email address (from AddEmail screen)
  static async addEmailAddress(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      const { email } = req.body;

      if (!email) {
        return sendBadRequestResponse(res, 'Email address is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendBadRequestResponse(res, 'Invalid email format');
      }

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      // Update email address
      application.email = email;
      await application.save();

      console.log(`✅ Email address added for application: ${applicationId}`);

      return sendSuccessResponse(res, 'Email address added successfully', {
        email: application.email,
        progress: application.progress
      });
    } catch (error: any) {
      console.error('❌ Add email address error:', error);
      return sendServerErrorResponse(res, 'Failed to add email address: ' + error.message);
    }
  }

  // Request Email OTP (from ApplyVerifyEmailCode screen)
  static async requestEmailOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      if (!application.email) {
        return sendBadRequestResponse(res, 'Please add an email address first');
      }

      // Check if we can resend OTP
      const resendCheck = await canResendOTP(applicationId, 'email');
      if (!resendCheck.canResend) {
        return sendBadRequestResponse(res, `Please wait ${resendCheck.waitTime} seconds before requesting a new OTP`);
      }

      // Generate and save OTP
      const otpResult = await createOTP(applicationId, 'email');
      if (otpResult.error) {
        return sendServerErrorResponse(res, 'Failed to generate OTP');
      }

      // Send Email OTP
      const emailResult = await sendEmailOTP(application.email, otpResult.otp, 'Applicant');
      if (!emailResult.success) {
        return sendServerErrorResponse(res, emailResult.error || 'Failed to send email OTP');
      }

      console.log(`✅ Email OTP sent for application: ${applicationId}`);

      return sendSuccessResponse(res, 'OTP sent to your email address');
    } catch (error: any) {
      console.error('❌ Request email OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to send OTP: ' + error.message);
    }
  }

  // Verify Email OTP (from ApplyVerifyEmailCode screen)
  static async verifyEmailOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        return sendBadRequestResponse(res, 'OTP is required');
      }

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      // Verify OTP
      const verificationResult = await verifyOTP(applicationId, 'email', otp);
      if (!verificationResult.success) {
        return sendBadRequestResponse(res, verificationResult.error || 'Invalid OTP');
      }

      // Update application
      application.emailVerified = true;
      application.progress.email = true;
      await application.save();

      console.log(`✅ Email verified for application: ${applicationId}`);

      return sendSuccessResponse(res, 'Email verified successfully', {
        emailVerified: true,
        progress: application.progress
      });
    } catch (error: any) {
      console.error('❌ Verify email OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to verify OTP: ' + error.message);
    }
  }

  // Check if all steps are completed
  static async checkCompletion(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      const { video, phone, email } = application.progress;
      const allCompleted = video && phone && email;

      return sendSuccessResponse(res, 'Completion status checked', {
        allCompleted,
        progress: application.progress,
        videoUploaded: application.videoUploaded,
        phoneVerified: application.phoneVerified,
        emailVerified: application.emailVerified,
        status: application.status
      });
    } catch (error: any) {
      console.error('❌ Check completion error:', error);
      return sendServerErrorResponse(res, 'Failed to check completion: ' + error.message);
    }
  }

  // Submit final application (when all 3 steps are done)
  static async submitApplication(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;

      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      // Check if all steps are completed
      const { video, phone, email } = application.progress;
      if (!video || !phone || !email) {
        return sendBadRequestResponse(res, 'Please complete all application steps before submitting');
      }

      // Additional validation
      if (!application.phoneVerified || !application.emailVerified || !application.videoUploaded) {
        return sendBadRequestResponse(res, 'Please complete all verification steps');
      }

      application.status = 'submitted';
      await application.save();

      console.log(`✅ Application submitted: ${applicationId}`);

      return sendSuccessResponse(res, 'Application submitted successfully. It will be reviewed shortly.', {
        status: application.status,
        applicationId: application._id,
        submittedAt: application.updatedAt
      });
    } catch (error: any) {
      console.error('❌ Submit application error:', error);
      return sendServerErrorResponse(res, 'Failed to submit application: ' + error.message);
    }
  }

  // Serve uploaded videos (for admin review)
  static async serveVideo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const videoPath = path.join('uploads/videos', filename);
      
      // Security check - prevent directory traversal
      const resolvedPath = path.resolve(videoPath);
      const uploadsDir = path.resolve('uploads/videos');
      
      if (!resolvedPath.startsWith(uploadsDir) || !fs.existsSync(videoPath)) {
        res.status(404).send('Video not found');
        return;
      }

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error: any) {
      console.error('❌ Serve video error:', error);
      res.status(404).send('Video not found');
    }
  }
}
import { Request, Response } from 'express';
import User from '../models/User';
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

export class UserController {
  // Create new user (formerly createApplication)
  static async createUser(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.create({
        progress: {
          video: false,
          phone: false,
          email: false
        },
        status: 'draft',
        isProfileCompleted: false
      });

      console.log(`✅ New user created: ${user._id}`);

      return sendSuccessResponse(
        res, 
        'User application started successfully', 
        { 
          userId: user._id,
          progress: user.progress
        }
      );
    } catch (error: any) {
      console.error('❌ Create user error:', error);
      return sendServerErrorResponse(res, 'Failed to create user: ' + error.message);
    }
  }

  // Get user (formerly getApplication)
  static async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      return sendSuccessResponse(res, 'User retrieved', {
        userId: user._id,
        progress: user.progress,
        videoUploaded: user.videoUploaded,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        status: user.status,
        isProfileCompleted: user.isProfileCompleted,
        profile: user.isProfileCompleted ? {
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          linkedinUrl: user.linkedinUrl
        } : null
      });
    } catch (error: any) {
      console.error('❌ Get user error:', error);
      return sendServerErrorResponse(res, 'Failed to retrieve user: ' + error.message);
    }
  }

  // Handle video upload
  static async uploadVideo(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      
      if (!req.file) {
        return sendBadRequestResponse(res, 'No video file uploaded');
      }

      const user = await User.findById(userId);
      if (!user) {
        fs.unlinkSync(req.file.path);
        return sendNotFoundResponse(res, 'User not found');
      }

      user.videoFilename = req.file.filename;
      user.videoUrl = getVideoUrl(req.file.filename);
      user.videoUploaded = true;
      user.videoReviewStatus = 'pending';
      user.progress.video = true;
      await user.save();

      console.log(`✅ Video uploaded for user: ${userId}`);

      return sendSuccessResponse(res, 'Video uploaded successfully', {
        videoUploaded: true,
        progress: user.progress
      });
    } catch (error: any) {
      console.error('❌ Video upload error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return sendServerErrorResponse(res, 'Failed to upload video: ' + error.message);
    }
  }

  // Add phone number
  static async addPhoneNumber(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { phone } = req.body;

      if (!phone) {
        return sendBadRequestResponse(res, 'Phone number is required');
      }

      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return sendBadRequestResponse(res, 'Invalid phone number format');
      }

      // Check if phone is already used by a COMPLETED user
      const existingUser = await User.findOne({ phone, isProfileCompleted: true });
      if (existingUser && String(existingUser._id) !== userId) {
        return sendBadRequestResponse(res, 'This phone number is already associated with an account');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      user.phone = phone;
      await user.save();

      console.log(`✅ Phone number added for user: ${userId}`);

      return sendSuccessResponse(res, 'Phone number added successfully', {
        phone: user.phone,
        progress: user.progress
      });
    } catch (error: any) {
      console.error('❌ Add phone number error:', error);
      return sendServerErrorResponse(res, 'Failed to add phone number: ' + error.message);
    }
  }

  // Request Phone OTP
  static async requestPhoneOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      if (!user.phone) {
        return sendBadRequestResponse(res, 'Please add a phone number first');
      }

      const resendCheck = await canResendOTP(userId, 'phone');
      if (!resendCheck.canResend) {
        return sendBadRequestResponse(res, `Please wait ${resendCheck.waitTime} seconds before requesting a new OTP`);
      }

      const otpResult = await createOTP(userId, 'phone');
      if (otpResult.error) {
        return sendServerErrorResponse(res, 'Failed to generate OTP');
      }

      const smsResult = await sendSMSOTP(user.phone, otpResult.otp);
      if (!smsResult.success) {
        return sendServerErrorResponse(res, smsResult.error || 'Failed to send SMS OTP');
      }

      console.log(`✅ Phone OTP sent for user: ${userId}`);

      return sendSuccessResponse(res, 'OTP sent to your phone number');
    } catch (error: any) {
      console.error('❌ Request phone OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to send OTP: ' + error.message);
    }
  }

  // Verify Phone OTP
  static async verifyPhoneOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        return sendBadRequestResponse(res, 'OTP is required');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      const verificationResult = await verifyOTP(userId, 'phone', otp);
      if (!verificationResult.success) {
        return sendBadRequestResponse(res, verificationResult.error || 'Invalid OTP');
      }

      user.phoneVerified = true;
      user.progress.phone = true;
      await user.save();

      console.log(`✅ Phone verified for user: ${userId}`);

      return sendSuccessResponse(res, 'Phone number verified successfully', {
        phoneVerified: true,
        progress: user.progress
      });
    } catch (error: any) {
      console.error('❌ Verify phone OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to verify OTP: ' + error.message);
    }
  }

  // Add email address
  static async addEmailAddress(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { email } = req.body;

      if (!email) {
        return sendBadRequestResponse(res, 'Email address is required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendBadRequestResponse(res, 'Invalid email format');
      }

      // Check if email is already used by a COMPLETED user
      const existingUser = await User.findOne({ email, isProfileCompleted: true });
      if (existingUser && String(existingUser._id) !== userId) {
        return sendBadRequestResponse(res, 'This email address is already associated with an account');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      user.email = email;
      await user.save();

      console.log(`✅ Email address added for user: ${userId}`);

      return sendSuccessResponse(res, 'Email address added successfully', {
        email: user.email,
        progress: user.progress
      });
    } catch (error: any) {
      console.error('❌ Add email address error:', error);
      return sendServerErrorResponse(res, 'Failed to add email address: ' + error.message);
    }
  }

  // Request Email OTP
  static async requestEmailOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      if (!user.email) {
        return sendBadRequestResponse(res, 'Please add an email address first');
      }

      const resendCheck = await canResendOTP(userId, 'email');
      if (!resendCheck.canResend) {
        return sendBadRequestResponse(res, `Please wait ${resendCheck.waitTime} seconds before requesting a new OTP`);
      }

      const otpResult = await createOTP(userId, 'email');
      if (otpResult.error) {
        return sendServerErrorResponse(res, 'Failed to generate OTP');
      }

      const emailResult = await sendEmailOTP(user.email, otpResult.otp, 'Applicant');
      if (!emailResult.success) {
        return sendServerErrorResponse(res, emailResult.error || 'Failed to send email OTP');
      }

      console.log(`✅ Email OTP sent for user: ${userId}`);

      return sendSuccessResponse(res, 'OTP sent to your email address');
    } catch (error: any) {
      console.error('❌ Request email OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to send OTP: ' + error.message);
    }
  }

  // Verify Email OTP
  static async verifyEmailOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        return sendBadRequestResponse(res, 'OTP is required');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      const verificationResult = await verifyOTP(userId, 'email', otp);
      if (!verificationResult.success) {
        return sendBadRequestResponse(res, verificationResult.error || 'Invalid OTP');
      }

      user.emailVerified = true;
      user.progress.email = true;
      await user.save();

      console.log(`✅ Email verified for user: ${userId}`);

      return sendSuccessResponse(res, 'Email verified successfully', {
        emailVerified: true,
        progress: user.progress
      });
    } catch (error: any) {
      console.error('❌ Verify email OTP error:', error);
      return sendServerErrorResponse(res, 'Failed to verify OTP: ' + error.message);
    }
  }

  // Check completion
  static async checkCompletion(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      const { video, phone, email } = user.progress;
      const allCompleted = video && phone && email;

      return sendSuccessResponse(res, 'Completion status checked', {
        allCompleted,
        progress: user.progress,
        videoUploaded: user.videoUploaded,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        status: user.status
      });
    } catch (error: any) {
      console.error('❌ Check completion error:', error);
      return sendServerErrorResponse(res, 'Failed to check completion: ' + error.message);
    }
  }

  // Submit application
  static async submitApplication(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      const { video, phone, email } = user.progress;
      if (!video || !phone || !email) {
        return sendBadRequestResponse(res, 'Please complete all application steps before submitting');
      }

      if (!user.phoneVerified || !user.emailVerified || !user.videoUploaded) {
        return sendBadRequestResponse(res, 'Please complete all verification steps');
      }

      user.status = 'submitted';
      await user.save();

      console.log(`✅ Application submitted for user: ${userId}`);

      return sendSuccessResponse(res, 'Application submitted successfully. It will be reviewed shortly.', {
        status: user.status,
        userId: user._id,
        submittedAt: user.updatedAt
      });
    } catch (error: any) {
      console.error('❌ Submit application error:', error);
      return sendServerErrorResponse(res, 'Failed to submit application: ' + error.message);
    }
  }

  // Serve video
  static async serveVideo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const videoPath = path.join('uploads/videos', filename);
      
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

  // Upload video from path
  static async uploadVideoFromPath(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { videoPath, fileName, mimeType } = req.body;

      if (!videoPath) {
        return sendBadRequestResponse(res, 'No video path provided');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      console.log('Processing video from path:', videoPath);

      user.videoFilename = fileName || 'ambassador-video.mp4';
      user.videoUrl = videoPath;
      user.videoUploaded = true;
      user.videoReviewStatus = 'pending';
      user.progress.video = true;
      await user.save();

      console.log(`✅ Video marked as uploaded for user: ${userId}`);

      return sendSuccessResponse(res, 'Video uploaded successfully', {
        videoUploaded: true,
        progress: user.progress
      });
    } catch (error: any) {
      console.error('❌ Video upload from path error:', error);
      return sendServerErrorResponse(res, 'Failed to process video: ' + error.message);
    }
  }

  // ================= PROFILE METHODS (Merged) =================

  // Complete profile
  static async completeProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { name, email, linkedinUrl, profileImage } = req.body;

      console.log(`📝 Completing profile for user: ${userId}`);

      if (!name || !email) {
        return sendBadRequestResponse(res, 'Name and email are required');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      if (user.status !== 'submitted') {
        return sendBadRequestResponse(res, 'Please submit your ambassador application first');
      }

      // Generate unique QR code data
      const uniqueProfileId = `punch_${userId}_${Date.now()}`;
      const qrCodeData = JSON.stringify({
        type: 'punch_profile',
        profileId: uniqueProfileId,
        userId: userId,
        name: name,
        email: email,
        linkedinUrl: linkedinUrl,
        timestamp: new Date().toISOString()
      });

      // Update user with profile data
      user.name = name;
      user.email = email; // Should match verified email, but allowing update here if needed
      user.linkedinUrl = linkedinUrl;
      user.profileImage = profileImage;
      user.qrCodeData = qrCodeData;
      user.qrCodeGenerated = true;
      user.isProfileCompleted = true;
      user.completedAt = new Date();

      await user.save();

      console.log(`✅ Profile completed for user: ${userId}`);

      return sendSuccessResponse(res, 'Profile completed successfully', {
        profileCompleted: true,
        userProfile: {
          id: user._id,
          name: user.name,
          email: user.email,
          linkedinUrl: user.linkedinUrl,
          profileImage: user.profileImage,
          qrCodeData: user.qrCodeData,
          isProfileCompleted: user.isProfileCompleted,
          completedAt: user.completedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Complete profile error:', error);
      return sendServerErrorResponse(res, 'Failed to complete profile: ' + error.message);
    }
  }

  // Get profile
  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      return sendSuccessResponse(res, 'Profile retrieved successfully', {
        userProfile: {
          id: user._id,
          name: user.name,
          email: user.email,
          linkedinUrl: user.linkedinUrl,
          profileImage: user.profileImage,
          qrCodeData: user.qrCodeData,
          isProfileCompleted: user.isProfileCompleted,
          completedAt: user.completedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Get profile error:', error);
      return sendServerErrorResponse(res, 'Failed to retrieve profile: ' + error.message);
    }
  }

  // Check profile completion
  static async checkProfileCompletion(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      const isCompleted = user?.isProfileCompleted || false;

      return sendSuccessResponse(res, 'Profile completion status checked', {
        isProfileCompleted: isCompleted,
        userProfile: isCompleted ? {
          id: user!._id,
          name: user!.name,
          email: user!.email,
          profileImage: user!.profileImage,
          qrCodeData: user!.qrCodeData
        } : null
      });
    } catch (error: any) {
      console.error('❌ Check profile completion error:', error);
      return sendServerErrorResponse(res, 'Failed to check profile completion: ' + error.message);
    }
  }

  // Update profile
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { name, email, linkedinUrl, profileImage } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
      if (profileImage !== undefined) user.profileImage = profileImage;

      await user.save();

      return sendSuccessResponse(res, 'Profile updated successfully', {
        userProfile: {
          id: user._id,
          name: user.name,
          email: user.email,
          linkedinUrl: user.linkedinUrl,
          profileImage: user.profileImage,
          qrCodeData: user.qrCodeData,
          isProfileCompleted: user.isProfileCompleted
        }
      });
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      return sendServerErrorResponse(res, 'Failed to update profile: ' + error.message);
    }
  }
}
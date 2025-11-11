import { Request, Response } from 'express';
import UserProfile from '../models/UserProfile';
import AmbassadorApplication from '../models/AmbassadorApplication';
import {
  sendSuccessResponse,
  sendBadRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse
} from '../helpers/responses/httpResponses';

export class ProfileController {
  // Complete user profile after ambassador application
  static async completeProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      const { name, email, linkedinUrl, profileImage } = req.body;

      console.log(`📝 Completing profile for application: ${applicationId}`);

      // Validate required fields
      if (!name || !email) {
        return sendBadRequestResponse(res, 'Name and email are required');
      }

      // Verify application exists and is submitted
      const application = await AmbassadorApplication.findById(applicationId);
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found');
      }

      if (application.status !== 'submitted') {
        return sendBadRequestResponse(res, 'Please submit your ambassador application first');
      }

      // Generate QR code data (you can enhance this with actual QR generation)
      const qrCodeData = JSON.stringify({
        type: 'user_profile',
        applicationId: applicationId,
        name: name,
        email: email,
        timestamp: new Date().toISOString()
      });

      // Create or update user profile
      let userProfile = await UserProfile.findOne({ applicationId });

      if (userProfile) {
        // Update existing profile
        userProfile.name = name;
        userProfile.email = email;
        userProfile.linkedinUrl = linkedinUrl;
        userProfile.profileImage = profileImage;
        userProfile.qrCodeData = qrCodeData;
        userProfile.isProfileCompleted = true;
        userProfile.completedAt = new Date();
      } else {
        // Create new profile
        userProfile = new UserProfile({
          applicationId,
          name,
          email,
          linkedinUrl,
          profileImage,
          qrCodeData,
          qrCodeGenerated: true,
          isProfileCompleted: true,
          completedAt: new Date()
        });
      }

      await userProfile.save();

      console.log(`✅ Profile completed for application: ${applicationId}`);

      return sendSuccessResponse(res, 'Profile completed successfully', {
        profileCompleted: true,
        userProfile: {
          id: userProfile._id,
          name: userProfile.name,
          email: userProfile.email,
          linkedinUrl: userProfile.linkedinUrl,
          profileImage: userProfile.profileImage,
          qrCodeData: userProfile.qrCodeData,
          isProfileCompleted: userProfile.isProfileCompleted,
          completedAt: userProfile.completedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Complete profile error:', error);
      return sendServerErrorResponse(res, 'Failed to complete profile: ' + error.message);
    }
  }

  // Get user profile by application ID
  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;

      const userProfile = await UserProfile.findOne({ applicationId });
      if (!userProfile) {
        return sendNotFoundResponse(res, 'Profile not found');
      }

      return sendSuccessResponse(res, 'Profile retrieved successfully', {
        userProfile: {
          id: userProfile._id,
          name: userProfile.name,
          email: userProfile.email,
          linkedinUrl: userProfile.linkedinUrl,
          profileImage: userProfile.profileImage,
          qrCodeData: userProfile.qrCodeData,
          isProfileCompleted: userProfile.isProfileCompleted,
          completedAt: userProfile.completedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Get profile error:', error);
      return sendServerErrorResponse(res, 'Failed to retrieve profile: ' + error.message);
    }
  }

  // Check if profile is completed
  static async checkProfileCompletion(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;

      const userProfile = await UserProfile.findOne({ applicationId });
      const isCompleted = userProfile?.isProfileCompleted || false;

      return sendSuccessResponse(res, 'Profile completion status checked', {
        isProfileCompleted: isCompleted,
        userProfile: isCompleted ? {
          id: userProfile!._id,
          name: userProfile!.name,
          email: userProfile!.email,
          profileImage: userProfile!.profileImage,
          qrCodeData: userProfile!.qrCodeData
        } : null
      });
    } catch (error: any) {
      console.error('❌ Check profile completion error:', error);
      return sendServerErrorResponse(res, 'Failed to check profile completion: ' + error.message);
    }
  }

  // Update profile information
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params;
      const { name, email, linkedinUrl, profileImage } = req.body;

      const userProfile = await UserProfile.findOne({ applicationId });
      if (!userProfile) {
        return sendNotFoundResponse(res, 'Profile not found');
      }

      // Update fields if provided
      if (name) userProfile.name = name;
      if (email) userProfile.email = email;
      if (linkedinUrl !== undefined) userProfile.linkedinUrl = linkedinUrl;
      if (profileImage !== undefined) userProfile.profileImage = profileImage;

      await userProfile.save();

      return sendSuccessResponse(res, 'Profile updated successfully', {
        userProfile: {
          id: userProfile._id,
          name: userProfile.name,
          email: userProfile.email,
          linkedinUrl: userProfile.linkedinUrl,
          profileImage: userProfile.profileImage,
          qrCodeData: userProfile.qrCodeData,
          isProfileCompleted: userProfile.isProfileCompleted
        }
      });
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      return sendServerErrorResponse(res, 'Failed to update profile: ' + error.message);
    }
  }
}
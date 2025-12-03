import { Request, Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import { sendSuccessResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses';

export class NotificationController {
  // List notifications for a user
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      return sendSuccessResponse(res, 'Notifications retrieved', { notifications });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve notifications: ' + error.message);
    }
  }

   // Get unread notification count
  static async getUnreadCount(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const count = await Notification.countDocuments({ userId, read: false });
      return sendSuccessResponse(res, 'Unread count retrieved', { count });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve unread count: ' + error.message);
    }
  }
  
  // Mark a notification as read
  static async markAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, notificationId } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return sendNotFoundResponse(res, 'Notification not found');
      }

      return sendSuccessResponse(res, 'Notification marked as read', { notification });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to mark notification as read: ' + error.message);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      await Notification.updateMany(
        { userId, read: false },
        { read: true }
      );

      return sendSuccessResponse(res, 'All notifications marked as read');
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to mark all notifications as read: ' + error.message);
    }
  }

  // Save push subscription
  static async saveSubscription(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params; // Keeping applicationId param name for now if route uses it, but logic uses User
      // Ideally route should use userId, let's check if we can support both or if route was updated.
      // The route in notificationRoutes.ts uses :applicationId for this specific endpoint in the previous diff?
      // Wait, in step 1279, I updated notificationRoutes to use :applicationId for saveSubscription.
      // "router.post('/applications/:applicationId/push-subscription', NotificationController.saveSubscription);"
      // So I should expect applicationId in params, but treat it as userId.
      
      const userId = applicationId || req.params.userId;
      const { subscription } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { pushSubscription: subscription },
        { new: true }
      );

      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      return sendSuccessResponse(res, 'Push subscription saved');
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to save subscription: ' + error.message);
    }
  }

  // Create a notification (Internal/System use)
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, type, title, description, metadata } = req.body;
      // Support applicationId in body for backward compatibility if needed
      const targetUserId = userId || req.body.applicationId;

      const notification = await Notification.create({
        userId: targetUserId,
        type,
        title,
        description,
        metadata,
        read: false,
        createdAt: new Date()
      });

      // TODO: Trigger actual push notification here if subscription exists
      // const user = await User.findById(targetUserId);
      // if (user?.pushSubscription) { ... }

      return sendSuccessResponse(res, 'Notification created', { notification });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to create notification: ' + error.message);
    }
  }
}

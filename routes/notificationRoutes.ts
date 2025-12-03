import express from 'express';
import { NotificationController } from '../controllers/notificationController';

const router = express.Router();

// Get notifications for a user
router.get('/users/:userId/notifications', NotificationController.list);

// Get unread notification count
router.get('/users/:userId/notifications/unread-count', NotificationController.getUnreadCount);

// Mark a notification as read
router.patch('/users/:userId/notifications/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/users/:userId/notifications/read-all', NotificationController.markAllAsRead);

// Save push subscription
router.post('/users/:userId/push-subscription', NotificationController.saveSubscription);

// Create a notification (for testing/system)
router.post('/notifications/create', NotificationController.create);

export default router;

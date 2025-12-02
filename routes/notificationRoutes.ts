import express from 'express';
import { NotificationController } from '../controllers/notificationController';

const router = express.Router();

// Get notifications for a user
router.get('/users/:userId/notifications', NotificationController.list);

// Mark a notification as read
router.patch('/users/:userId/notifications/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/users/:userId/notifications/read-all', NotificationController.markAllAsRead);

// Save push subscription
router.post('/users/:userId/push-subscription', NotificationController.saveSubscription);

// Create a notification (for testing/system)
router.post('/notifications/create', NotificationController.create);

export default router;

import express from 'express';
import * as notificationController from '../controllers/notificationController';

const router = express.Router();

// Get notifications for a user
router.get('/applications/:applicationId/notifications', notificationController.list);

// Mark a notification as read
router.patch('/notifications/:id/read', notificationController.markRead);

// Mark all notifications as read
router.post('/applications/:applicationId/notifications/read-all', notificationController.markAllRead);

// Save push subscription
router.post('/applications/:applicationId/push-subscription', notificationController.saveSubscription);

// Create a notification (for testing/system)
router.post('/notifications/create', notificationController.create);

export default router;

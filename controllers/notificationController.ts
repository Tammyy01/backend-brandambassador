import { Request, Response } from 'express';
import Notification from '../models/Notification';
import AmbassadorApplication from '../models/AmbassadorApplication';

// Get notifications for a user
export const list = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const notifications = await Notification.find({ applicationId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};

// Mark a notification as read
export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error });
  }
};

// Mark all notifications as read
export const markAllRead = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    await Notification.updateMany(
      { applicationId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error });
  }
};

// Save push subscription
export const saveSubscription = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { subscription } = req.body;

    await AmbassadorApplication.findByIdAndUpdate(
      applicationId,
      { pushSubscription: subscription }
    );

    res.json({ message: 'Push subscription saved' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving subscription', error });
  }
};

// Create a notification (Internal/System use)
export const create = async (req: Request, res: Response) => {
  try {
    const { applicationId, type, title, description, metadata } = req.body;
    
    const notification = new Notification({
      applicationId,
      type,
      title,
      description,
      metadata
    });

    await notification.save();

    // TODO: Trigger actual push notification here if subscription exists
    // const user = await AmbassadorApplication.findById(applicationId);
    // if (user?.pushSubscription) { ... }

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error });
  }
};

import { Request, Response } from 'express'
import Event from '../models/Event'
import User from '../models/User'
import { sendSuccessResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses'

import Notification from '../models/Notification'

export class EventsController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const events = await Event.find().sort({ date: 1 })
      return sendSuccessResponse(res, 'Events retrieved', { events })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve events: ' + error.message)
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const event = await Event.findById(id).populate('attendees', 'name profileImage')
      
      if (!event) {
        return sendNotFoundResponse(res, 'Event not found')
      }

      return sendSuccessResponse(res, 'Event retrieved', { event })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve event: ' + error.message)
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, date, location } = req.body
      
      const event = await Event.create({
        title,
        description,
        date,
        location
      })

      // Notify all users about the new event
      try {
        const users = await User.find({}, '_id');
        console.log(`Found ${users.length} users to notify`);
        
        const notifications = users.map(user => ({
          userId: user._id,
          title: `New Event: ${title}`,
          description: `A new event "${title}" has been added. Check it out!`,
          type: 'event',
          read: false,
          createdAt: new Date()
        }));

        if (notifications.length > 0) {
          const result = await Notification.insertMany(notifications);
          console.log(`Created ${result.length} notifications`);
        }
      } catch (notifyError) {
        console.error('Failed to create notifications:', notifyError);
        // Continue execution - don't fail event creation just because notification failed
      }

      return sendSuccessResponse(res, 'Event created', { event })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to create event: ' + error.message)
    }
  }

  static async join(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { userId } = req.body

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $addToSet: { attendees: userId } },
        { new: true }
      ).populate('attendees', 'name profileImage')

      if (!event) {
        return sendNotFoundResponse(res, 'Event not found')
      }

      return sendSuccessResponse(res, 'Joined event', { event })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to join event: ' + error.message)
    }
  }

  static async leave(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { userId } = req.body

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $pull: { attendees: userId } },
        { new: true }
      ).populate('attendees', 'name profileImage')

      if (!event) {
        return sendNotFoundResponse(res, 'Event not found')
      }

      return sendSuccessResponse(res, 'Left event', { event })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to leave event: ' + error.message)
    }
  }
};

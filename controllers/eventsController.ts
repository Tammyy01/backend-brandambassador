import { Request, Response } from 'express';
import Event from '../models/Event';
import AmbassadorApplication from '../models/AmbassadorApplication';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const joinEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { applicationId } = req.body; // Expecting applicationId in body

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.attendees.includes(applicationId)) {
      return res.status(400).json({ message: 'User already attending this event' });
    }

    event.attendees.push(applicationId);
    await event.save();

    res.status(200).json({ message: 'Successfully joined event', event });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const leaveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove applicationId from attendees
    event.attendees = event.attendees.filter(
      (attendee) => attendee.toString() !== applicationId
    );
    await event.save();

    res.status(200).json({ message: 'Successfully left event', event });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

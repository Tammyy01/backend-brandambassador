import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  joinEvent,
  leaveEvent,
} from '../controllers/eventsController';

const router = express.Router();

router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.post('/events', createEvent);
router.post('/events/:id/join', joinEvent);
router.post('/events/:id/leave', leaveEvent);

export default router;

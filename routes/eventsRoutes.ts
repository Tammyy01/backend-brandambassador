import express from 'express';
import { EventsController } from '../controllers/eventsController';

const router = express.Router();

router.get('/events', EventsController.list);
router.get('/events/:id', EventsController.get);
router.post('/events', EventsController.create);
router.post('/events/:id/join', EventsController.join);
router.post('/events/:id/leave', EventsController.leave);

export default router;

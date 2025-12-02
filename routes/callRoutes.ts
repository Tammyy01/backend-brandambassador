import express from 'express';
import { CallController } from '../controllers/callController';

const router = express.Router();

router.post('/users/:userId/calls', CallController.create);
router.get('/users/:userId/calls', CallController.list);

export default router;

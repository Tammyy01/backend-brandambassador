import express from 'express';
import { logCall, getCalls } from '../controllers/callController';

const router = express.Router();

router.post('/applications/:applicationId/calls', logCall);
router.get('/applications/:applicationId/calls', getCalls);

export default router;

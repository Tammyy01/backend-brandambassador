import express from 'express';
import { groqChatCompletion } from '../controllers/groqController';

const router = express.Router();

router.post('/groq/complete', groqChatCompletion);

export default router;
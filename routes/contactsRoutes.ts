import express from 'express';
import { ContactController } from '../controllers/contactController';

const router = express.Router();

router.post('/users/:userId/contacts', ContactController.create);
router.get('/users/:userId/contacts', ContactController.list);
router.get('/users/:userId/contacts/:contactId', ContactController.get);
router.put('/users/:userId/contacts/:contactId', ContactController.update);
router.delete('/users/:userId/contacts/:contactId', ContactController.delete);
router.patch('/users/:userId/contacts/:contactId/star', ContactController.toggleStar);

export default router;
import express from 'express';
import { ReimbursementController } from '../controllers/reimbursementController';

const router = express.Router();

router.post('/users/:userId/reimbursements', ReimbursementController.create);
router.get('/users/:userId/reimbursements', ReimbursementController.list);
router.get('/users/:userId/reimbursements/stats', ReimbursementController.getStats);
router.get('/reimbursements', ReimbursementController.listAll);
router.patch('/reimbursements/:id/status', ReimbursementController.updateStatus);

export default router;

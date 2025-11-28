import express from 'express';
import {
  createReimbursement,
  getReimbursements,
  getReimbursementStats,
} from '../controllers/reimbursementController';

const router = express.Router();

router.post('/applications/:applicationId/reimbursements', createReimbursement);
router.get('/applications/:applicationId/reimbursements', getReimbursements);
router.get('/applications/:applicationId/reimbursements/stats', getReimbursementStats);

export default router;

import express from 'express';
import {
  createReimbursement,
  getReimbursements,
  getReimbursementStats,
  getAllReimbursements,
  updateReimbursementStatus,
} from '../controllers/reimbursementController';

const router = express.Router();

// User routes
router.post('/applications/:applicationId/reimbursements', createReimbursement);
router.get('/applications/:applicationId/reimbursements', getReimbursements);
router.get('/applications/:applicationId/reimbursements/stats', getReimbursementStats);

// Admin routes
router.get('/reimbursements', getAllReimbursements);
router.patch('/reimbursements/:id/status', updateReimbursementStatus);

export default router;

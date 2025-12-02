import express from 'express';
import { DashboardController } from '../controllers/dashboardController';

const router = express.Router();

router.get('/users/:userId/dashboard/stats', DashboardController.getStats);
router.get('/users/:userId/dashboard/chart', DashboardController.getChartData);

export default router;

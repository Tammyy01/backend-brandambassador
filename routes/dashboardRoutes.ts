import express from 'express';
import { getDashboardStats, getChartData } from '../controllers/dashboardController';

const router = express.Router();

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/chart', getChartData);

export default router;

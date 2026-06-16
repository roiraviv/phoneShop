import { Router } from 'express';
import {
  getDashboard,
  getSummary,
  getCharts,
  getBreakdown,
  getLowStock,
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/dashboard', getDashboard);
router.get('/summary', getSummary);
router.get('/charts', getCharts);
router.get('/breakdown', getBreakdown);
router.get('/alerts/low-stock', getLowStock);

export default router;

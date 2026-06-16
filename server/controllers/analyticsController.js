import {
  getFinancialSummary,
  getDailyProfitabilityChart,
  getWeeklyProfitabilityChart,
  getMonthlyProfitabilityChart,
  getProfitBreakdown,
  getFullDashboard,
} from '../services/analyticsService.js';
import { getLowStockAlerts } from '../utils/stockAlerts.js';

/**
 * Controller לאנליטיקה ודשבורד פיננסי
 */

/**
 * @route GET /api/analytics/dashboard
 * @desc דשבורד מלא – סיכומים + גרפים
 */
export async function getDashboard(req, res) {
  try {
    const dashboard = await getFullDashboard();
    const lowStockAlerts = await getLowStockAlerts();

    res.json({
      success: true,
      data: {
        ...dashboard,
        alerts: {
          lowStock: lowStockAlerts,
          lowStockCount: lowStockAlerts.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת הדשבורד',
      error: error.message,
    });
  }
}

/**
 * @route GET /api/analytics/summary
 * @desc סיכום פיננסי לתקופה מותאמת
 * query: startDate, endDate (ISO)
 */
export async function getSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(1));

    const end = endDate ? new Date(endDate) : new Date();

    const summary = await getFinancialSummary(start, end);

    res.json({
      success: true,
      data: {
        period: {
          from: start,
          to: end,
        },
        ...summary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * @route GET /api/analytics/charts
 * @desc נתוני גרפים לרווחיות
 * query: period = daily|weekly|monthly, range = מספר יחידות זמן
 */
export async function getCharts(req, res) {
  try {
    const { period = 'daily', range } = req.query;

    let chartData;

    switch (period) {
      case 'weekly':
        chartData = await getWeeklyProfitabilityChart(Number(range) || 12);
        break;
      case 'monthly':
        chartData = await getMonthlyProfitabilityChart(Number(range) || 12);
        break;
      case 'daily':
      default:
        chartData = await getDailyProfitabilityChart(Number(range) || 30);
    }

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * @route GET /api/analytics/breakdown
 * @desc פילוח רווח לפי קטגוריה (טלפונים/אביזרים/תיקונים)
 */
export async function getBreakdown(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));

    const end = endDate ? new Date(endDate) : new Date();

    const breakdown = await getProfitBreakdown(start, end);

    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * @route GET /api/analytics/alerts/low-stock
 * @desc התראות מלאי נמוך
 */
export async function getLowStock(req, res) {
  try {
    const alerts = await getLowStockAlerts();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

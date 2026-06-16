import express from 'express';
import cors from 'cors';
import saleRoutes from './routes/saleRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'מערכת ניהול חנות טלפונים פעילה',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'הנתיב המבוקש לא נמצא',
  });
});

app.use((err, _req, res, _next) => {
  console.error('שגיאת שרת:', err);
  res.status(500).json({
    success: false,
    message: 'שגיאה פנימית בשרת',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;

import api from './client';

export const fetchDashboard = () => api.get('/analytics/dashboard');
export const fetchCharts = (period = 'monthly', range = 12) =>
  api.get(`/analytics/charts?period=${period}&range=${range}`);
export const fetchSales = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api.get(`/sales${q ? `?${q}` : ''}`);
};
export const fetchSalesReport = ({ startDate, endDate, sortBy = 'quantity' } = {}) => {
  const q = new URLSearchParams();
  if (startDate) q.set('startDate', startDate);
  if (endDate) q.set('endDate', endDate);
  if (sortBy) q.set('sortBy', sortBy);
  return api.get(`/analytics/sales-report?${q}`);
};
export const fetchInventoryReport = (asOf) => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
  return api.get(`/analytics/inventory-report${q}`);
};

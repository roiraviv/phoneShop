import api from './client';

export const fetchDashboard = () => api.get('/analytics/dashboard');
export const fetchCharts = (period = 'monthly', range = 12) =>
  api.get(`/analytics/charts?period=${period}&range=${range}`);
export const fetchSales = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api.get(`/sales${q ? `?${q}` : ''}`);
};

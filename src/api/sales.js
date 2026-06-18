import api from './client';

export const scanProduct = (code) => api.post('/sales/scan', { code });
export const previewSale = (items, discount = 0) =>
  api.post('/sales/preview', { items, discount });
export const createSale = (payload) => api.post('/sales', payload);
export const fetchSaleById = (id) => api.get(`/sales/${id}`);

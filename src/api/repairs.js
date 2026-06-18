import api from './client';

export const fetchRepair = (id) => api.get(`/repairs/${id}`);
export const fetchRepairs = (status) =>
  api.get(`/repairs${status ? `?status=${encodeURIComponent(status)}` : ''}`);
export const createRepair = (data) => api.post('/repairs', data);
export const updateRepair = (id, data) => api.patch(`/repairs/${id}`, data);

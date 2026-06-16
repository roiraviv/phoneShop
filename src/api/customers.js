import api from './client';

export const fetchCustomers = (search) =>
  api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const fetchCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.patch(`/customers/${id}`, data);

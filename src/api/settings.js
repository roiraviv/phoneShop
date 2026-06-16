import api from './client';

export const fetchSettings = () => api.get('/settings');
export const updateSettings = (data) => api.patch('/settings', data);
export const testSmtpEmail = (to) => api.post('/settings/test-email', { to });

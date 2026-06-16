import api from './client';

export const globalSearch = (q) =>
  api.get(`/search?q=${encodeURIComponent(q)}`);

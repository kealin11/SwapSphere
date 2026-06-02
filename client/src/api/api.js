import axios from 'axios';

export const API = import.meta.env.VITE_API_URL;

const API_ORIGIN = API?.replace(/\/api\/?$/, '') || '';

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const buildImageUrl = (imageUrl, fallback = '') => {
  if (!imageUrl) return fallback;
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;

  // TODO: Migrate /uploads assets to persistent object storage/CDN for production.
  return API_ORIGIN ? `${API_ORIGIN}${imageUrl}` : imageUrl;
};

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Listings API
export const listingsAPI = {
  getAll: () => api.get('/listings'),
  getById: (id) => api.get(`/listings/${id}`),
  getByUserId: (userId) => api.get(`/listings/user/${userId}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
  },
};

// PayFast API
export const paymentAPI = {
  initiatePayment: (amount, itemName, additionalData = {}) =>
    api.post('/payfast/pay', { amount, item_name: itemName, ...additionalData }),
};

// Wallet API
export const walletAPI = {
  getWalletInfo: (userId) => api.get(`/wallet/${userId}`),
  withdraw: (userId, amount, description = '') =>
    api.post(`/wallet/withdraw/${userId}`, { amount, description }),
};

// Orders API
export const ordersAPI = {
  getBoughtOrders: (userId) => api.get(`/orders/bought/${userId}`),
  getSoldOrders: (userId) => api.get(`/orders/sold/${userId}`),
  getTransactionHistory: (userId, limit = 20, offset = 0) =>
    api.get(`/orders/transactions/${userId}`, { params: { limit, offset } }),
};

// Conversations API
export const conversationsAPI = {
  getAll: () => api.get('/conversations'),
  getById: (id) => api.get(`/conversations/${id}`),
  create: (data) => api.post('/conversations', data),
};

// Messages API
export const messagesAPI = {
  getByConversation: (conversationId) => api.get(`/messages/${conversationId}`),
  send: (data) => api.post('/messages', data),
};

// Offers API
export const offersAPI = {
  getAll: () => api.get('/offers'),
  create: (data) => api.post('/offers', data),
  accept: (id) => api.patch(`/offers/${id}/accept`),
  reject: (id) => api.patch(`/offers/${id}/reject`),
};

export default api;

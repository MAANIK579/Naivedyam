// src/api/client.js — Full API client for Navedyam
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function inferDevApiBaseUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (!host || host === 'localhost' || host === '127.0.0.1' || !isIpv4) return null;
  return `http://${host}:4000/api`;
}

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  inferDevApiBaseUrl() ||
  'http://10.52.5.10:4000/api';

export const SOCKET_URL = BASE_URL.replace('/api', '');

async function getToken() {
  return await SecureStore.getItemAsync('navedyam_token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
  } catch (_) {
    throw new Error(
      `Cannot reach server at ${BASE_URL}. Start backend and ensure phone can access your PC's IP.`
    );
  }

  const data = await res.json();
  if (!res.ok) {
    const details = Array.isArray(data?.details) ? data.details.join(', ') : '';
    throw new Error(details || data?.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  // ── Auth ───────────────────────────────────────────────
  register:      (body)  => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:         (body)  => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  getMe:         ()      => request('/auth/me'),
  updateMe:      (body)  => request('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  savePushToken: (token) => request('/auth/me/push-token', { method: 'PUT', body: JSON.stringify({ push_token: token }) }),

  // ── Menu ───────────────────────────────────────────────
  getCategories: () => request('/menu/categories'),
  getMenuItems: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/menu/items${qs ? '?' + qs : ''}`);
  },
  getMenuItem:     (id)    => request(`/menu/items/${id}`),
  searchMenuItems: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/menu/items?${qs}`);
  },

  // ── Orders ─────────────────────────────────────────────
  placeOrder:  (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: ()     => request('/orders'),
  getOrder:    (id)   => request(`/orders/${id}`),
  reorder:     (id)   => request(`/orders/${id}/reorder`, { method: 'POST' }),
  cancelOrder: (id, reason) =>
    request(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // ── Tracking ───────────────────────────────────────────
  trackOrder: (id) => request(`/track/${id}`),

  // ── Reviews ────────────────────────────────────────────
  submitReview:   (body)          => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getItemReviews: (itemId, page)  => request(`/reviews/item/${itemId}?page=${page || 1}`),
  getMyReviews:   ()              => request('/reviews/my'),

  // ── Coupons ────────────────────────────────────────────
  validateCoupon:   (code, cartTotal) =>
    request('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, cart_total: cartTotal }) }),
  getActiveCoupons: () => request('/coupons/active'),

  // ── Addresses ──────────────────────────────────────────
  getAddresses:      ()         => request('/addresses'),
  addAddress:        (body)     => request('/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress:     (id, body) => request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddress:     (id)       => request(`/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id)       => request(`/addresses/${id}/default`, { method: 'PATCH' }),

  // ── Favorites ──────────────────────────────────────────
  getFavorites:   ()   => request('/favorites'),
  addFavorite:    (id) => request(`/favorites/${id}`, { method: 'POST' }),
  removeFavorite: (id) => request(`/favorites/${id}`, { method: 'DELETE' }),

  // ── Payments ───────────────────────────────────────────
  createPaymentOrder: (orderId) =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ order_id: orderId }) }),
  verifyPayment: (body) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),

  // ── Notifications ──────────────────────────────────────
  getNotifications:         (page) => request(`/notifications?page=${page || 1}`),
  markNotificationRead:     (id)   => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: ()     => request('/notifications/read-all', { method: 'PATCH' }),
};

export default api;

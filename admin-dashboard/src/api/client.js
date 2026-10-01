import axios from 'axios';

export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin);

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

/* ---- Request interceptor: attach JWT ---- */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ---- Response interceptor: handle 401 ---- */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ---- Named API methods ---- */
export const api = {
  /* Auth */
  login:    (body)             => axiosInstance.post('/auth/login', body),
  getMe:    ()                 => axiosInstance.get('/auth/me'),

  /* Dashboard */
  getDashboard: ()             => axiosInstance.get('/admin/dashboard'),
  getAnalytics: (params)       => axiosInstance.get('/admin/analytics', { params }),

  /* Orders */
  getAllOrders:    (params)     => axiosInstance.get('/admin/orders', { params }),
  getActiveDeliveries: ()      => axiosInstance.get('/admin/deliveries/active'),
  getOrderDetail: (id)         => axiosInstance.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    axiosInstance.patch(`/track/${id}/status`, { status }),
  updatePaymentStatus: (id, payment_status) =>
    axiosInstance.patch(`/admin/orders/${id}/payment`, { payment_status }),

  /* Menu */
  getMenuItems:     (params)   => axiosInstance.get('/admin/menu/items', { params }),
  getCategories:    (params)   => axiosInstance.get('/admin/menu/categories', { params }),
  createMenuItem:   (body)     => axiosInstance.post('/admin/menu/items', body),
  updateMenuItem:   (id, body) => axiosInstance.put(`/admin/menu/items/${id}`, body),
  deleteMenuItem:   (id)       => axiosInstance.delete(`/admin/menu/items/${id}`),
  createCategory:   (body)     => axiosInstance.post('/admin/menu/categories', body),
  updateCategory:   (id, body) => axiosInstance.put(`/admin/menu/categories/${id}`, body),

  /* Coupons */
  getCoupons:    (params)      => axiosInstance.get('/coupons', { params }),
  createCoupon:  (body)        => axiosInstance.post('/coupons', body),
  updateCoupon:  (id, body)    => axiosInstance.put(`/coupons/${id}`, body),
  deleteCoupon:  (id)          => axiosInstance.delete(`/coupons/${id}`),

  /* Users */
  getUsers: (params)           => axiosInstance.get('/admin/users', { params }),
};

export default axiosInstance;

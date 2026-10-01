import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  /* Restore session on mount */
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then((res) => {
        const user = res.data?.user ?? res.data;
        if (user?.role === 'admin') {
          setAdmin(user);
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * login(phone, password)
   * Calls POST /auth/login, verifies admin role, persists token.
   */
  const login = async (phone, password) => {
    const res  = await api.login({ phone, password });
    const data = res.data;

    const token = data.token ?? data.access_token ?? data.accessToken;
    const user  = data.user  ?? data.admin ?? data;

    if (!token) throw new Error('No token returned from server.');
    if (user?.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    localStorage.setItem('admin_token', token);
    setAdmin(user);
    return user;
  };

  /** logout() – clears token and admin state */
  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AuthProvider>');
  return ctx;
}

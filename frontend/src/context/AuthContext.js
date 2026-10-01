// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import api from '../api/client';

const AuthContext = createContext(null);

async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (tokenData?.data) {
      await api.savePushToken(tokenData.data).catch(() => {});
    }
  } catch (_) {}
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On app launch — restore session
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('navedyam_token');
        if (token) {
          const data = await api.getMe();
          setUser(data.user);
        }
      } catch (_) {
        await SecureStore.deleteItemAsync('navedyam_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(phone, password) {
    const data = await api.login({ phone, password });
    await SecureStore.setItemAsync('navedyam_token', data.token);
    setUser(data.user);
    registerPushToken();
    return data;
  }

  async function register(name, phone, password, address) {
    const data = await api.register({ name, phone, password, address });
    await SecureStore.setItemAsync('navedyam_token', data.token);
    setUser(data.user);
    registerPushToken();
    return data;
  }

  async function logout() {
    await SecureStore.deleteItemAsync('navedyam_token');
    setUser(null);
  }

  async function updateProfile(updates) {
    await api.updateMe(updates);
    setUser(prev => ({ ...prev, ...updates }));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

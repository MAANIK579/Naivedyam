// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import api from '../api/client';

const AuthContext = createContext(null);

async function setStoredToken(token) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('navedyam_token', token);
    } else {
      await SecureStore.setItemAsync('navedyam_token', token);
    }
  } catch (_) {}
}

async function getStoredToken() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('navedyam_token');
    }
    return await SecureStore.getItemAsync('navedyam_token');
  } catch (_) {
    return null;
  }
}

async function removeStoredToken() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('navedyam_token');
    } else {
      await SecureStore.deleteItemAsync('navedyam_token');
    }
  } catch (_) {}
}

async function registerPushToken() {
  if (Platform.OS === 'web') return;
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

  // On app launch — restore session safely
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          const data = await api.getMe();
          if (active && data?.user) {
            setUser(data.user);
          }
        }
      } catch (_) {
        await removeStoredToken();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function login(phone, password) {
    const data = await api.login({ phone, password });
    await setStoredToken(data.token);
    setUser(data.user);
    registerPushToken();
    return data;
  }

  async function register(name, phone, password, address) {
    const data = await api.register({ name, phone, password, address });
    await setStoredToken(data.token);
    setUser(data.user);
    registerPushToken();
    return data;
  }

  async function logout() {
    await removeStoredToken();
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

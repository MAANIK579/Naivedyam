// src/context/ThemeContext.js — Light/Dark mode management
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../theme';

const ThemeContext = createContext(null);

const THEME_KEY = 'navedyam_theme_mode';

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true); // Default to dark mode
  const [loading, setLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // Toggle theme and persist
  async function toggleTheme() {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light');
    } catch (_) {}
  }

  // Set specific theme
  async function setTheme(mode) {
    const newIsDark = mode === 'dark';
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (_) {}
  }

  // Get current colors based on theme
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;

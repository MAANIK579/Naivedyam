// src/context/FavoritesContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
      setFavorites([]);
    }
  }, [user]);

  async function loadFavorites() {
    setLoading(true);
    try {
      const data = await api.getFavorites();
      const items = data.favorites || data || [];
      setFavorites(items);
      setFavoriteIds(new Set(items.map(item => item._id || item.id)));
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  }

  function isFavorite(id) {
    return favoriteIds.has(id);
  }

  async function toggleFavorite(id) {
    const wasFav = favoriteIds.has(id);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (wasFav) {
        await api.removeFavorite(id);
        setFavorites(prev => prev.filter(item => (item._id || item.id) !== id));
      } else {
        await api.addFavorite(id);
        await loadFavorites();
      }
    } catch (err) {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFav) next.add(id);
        else next.delete(id);
        return next;
      });
      console.warn('Failed to toggle favorite:', err);
    }
  }

  return (
    <FavoritesContext.Provider value={{ isFavorite, toggleFavorite, favorites, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

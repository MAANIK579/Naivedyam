// src/components/HeartButton.js — with theme support
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';

export default function HeartButton({ itemId, style, size = 20 }) {
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(itemId);

  return (
    <TouchableOpacity
      onPress={() => toggleFavorite(itemId)}
      activeOpacity={0.7}
      style={[styles.btn, style]}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    >
      <Ionicons
        name={favorited ? 'heart' : 'heart-outline'}
        size={size}
        color={favorited ? colors.saffron : colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
});

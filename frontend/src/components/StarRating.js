// src/components/StarRating.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({ rating = 0, size = 16, interactive = false, onRate }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {STARS.map(star => {
        const filled = star <= Math.round(rating);
        const iconName = filled ? 'star' : 'star-outline';
        const color = filled ? colors.saffron : colors.border;

        if (interactive) {
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onRate && onRate(star)}
              activeOpacity={0.7}
              style={styles.starTouch}
            >
              <Ionicons name={iconName} size={size} color={color} />
            </TouchableOpacity>
          );
        }

        return (
          <Ionicons key={star} name={iconName} size={size} color={color} style={{ marginRight: 1 }} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starTouch: {
    paddingHorizontal: 3,
  },
});

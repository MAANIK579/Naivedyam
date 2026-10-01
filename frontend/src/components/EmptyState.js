// src/components/EmptyState.js — with theme support
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../theme';
import { Button } from './index';

export default function EmptyState({ emoji, iconName, title, subtitle, action }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {iconName ? (
        <Ionicons name={iconName} size={56} color={colors.border} style={{ marginBottom: 20 }} />
      ) : !!emoji && (
        <Text style={styles.emoji}>{emoji}</Text>
      )}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          style={styles.btn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    ...FONTS.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 32,
  },
});

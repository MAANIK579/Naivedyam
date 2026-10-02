// src/components/index.js — Shared UI components for Navedyam

import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW, SPACING } from '../theme';

// ── Button ────────────────────────────────────────────────
export { default as Button } from './Button';

// ── Input ──────────────────────────────────────────────────
export function Input({ label, style, inputStyle, error, leftIcon, ...props }) {
  const { colors } = useTheme();

  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label && <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>}
      <View style={[
        styles.inputWrap,
        {
          backgroundColor: colors.creamDark,
          borderColor: error ? colors.error : colors.border,
        }
      ]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={colors.textLight} style={{ marginRight: 8 }} />
        )}
        <TextInput
          placeholderTextColor={colors.textLight}
          style={[styles.input, { color: colors.text }, leftIcon && { paddingLeft: 0 }, inputStyle]}
          {...props}
        />
      </View>
      {error && <Text style={[styles.inputError, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style, elevated = false, onPress }) {
  const { colors } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated ? colors.cardElevated : colors.cardBg,
      borderColor: colors.border,
    },
    elevated ? SHADOW.medium : SHADOW.small,
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ── VegBadge (Official Standard Indian FSSAI Veg Symbol) ────
export { default as VegBadge } from './VegBadge';

// ── StatusPill ────────────────────────────────────────────
export function StatusPill({ status }) {
  const { isDark, colors } = useTheme();

  const map = {
    placed:           { bg: isDark ? '#431407' : '#FFEDD5', border: '#FB923C', color: colors.saffron, label: 'Placed',      icon: 'receipt-outline' },
    confirmed:        { bg: isDark ? '#431407' : '#FFEDD5', border: '#FB923C', color: colors.saffron, label: 'Confirmed',   icon: 'checkmark-circle-outline' },
    preparing:        { bg: isDark ? '#451A03' : '#FEF3C7', border: '#FBBF24', color: colors.turmeric, label: 'Cooking',     icon: 'flame-outline' },
    out_for_delivery: { bg: isDark ? '#052E16' : '#DCFCE7', border: '#4ADE80', color: colors.green,   label: 'On the Way',  icon: 'bicycle-outline' },
    delivered:        { bg: isDark ? '#052E16' : '#DCFCE7', border: '#4ADE80', color: colors.green,   label: 'Delivered',   icon: 'checkmark-done-circle-outline' },
    cancelled:        { bg: isDark ? '#450A0A' : '#FEE2E2', border: '#F87171', color: colors.error,   label: 'Cancelled',   icon: 'close-circle-outline' },
  };
  const { bg, border, color, label, icon } = map[status] || {
    bg: colors.creamDark,
    border: colors.border,
    color: colors.textMuted,
    label: status,
    icon: 'help-circle-outline',
  };

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
      <Ionicons name={icon} size={13} color={color} style={{ marginRight: 4 }} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }, style]} />;
}

// ── Re-exports ────────────────────────────────────────────
export { default as BannerCarousel } from './BannerCarousel';
export { default as ItemDetailModal } from './ItemDetailModal';
export { default as HeartButton } from './HeartButton';
export { default as StarRating } from './StarRating';
export { default as GlassCard } from './GlassCard';
export { default as AmbientGlow } from './AmbientGlow';

// ── SectionHeader ─────────────────────────────────────────
export function SectionHeader({ title, subtitle, right }) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.sectionSub, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {right && right}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...FONTS.bold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  inputLabel: {
    ...FONTS.semibold,
    fontSize: 13,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    ...FONTS.regular,
  },
  inputError: {
    ...FONTS.medium,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    ...FONTS.bold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.bold,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
});

export { default as ActiveOrderTracker } from './ActiveOrderTracker';
export { default as Plate } from './Plate';

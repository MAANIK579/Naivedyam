// src/components/index.js — Shared UI components with theme support

import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW, SPACING } from '../theme';

// ── Button ────────────────────────────────────────────────
export function Button({ title, onPress, loading, variant = 'primary', style, textStyle, icon }) {
  const { colors } = useTheme();

  const bg = variant === 'primary'  ? colors.saffron
           : variant === 'outline'  ? 'transparent'
           : variant === 'green'    ? colors.green
           : variant === 'danger'   ? colors.error
           : colors.brown;

  const borderColor = variant === 'outline' ? colors.saffron : 'transparent';
  const color       = variant === 'outline' ? colors.saffron : colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor, borderWidth: variant === 'outline' ? 2 : 0, opacity: loading ? 0.7 : 1 },
        style
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={18} color={color} />}
          <Text style={[styles.btnText, { color }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Input ──────────────────────────────────────────────────
export function Input({ label, style, inputStyle, error, leftIcon, ...props }) {
  const { colors } = useTheme();

  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label && <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>}
      <View style={[styles.inputWrap, { backgroundColor: colors.creamDark, borderColor: colors.border }]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }, leftIcon && { paddingLeft: 0 }, inputStyle]}
          {...props}
        />
      </View>
      {error && <Text style={[styles.inputError, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style }) {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.cardBg, borderColor: colors.borderLight },
      style
    ]}>
      {children}
    </View>
  );
}

// ── VegBadge ──────────────────────────────────────────────
export function VegBadge({ isVeg }) {
  const { colors } = useTheme();
  const color = isVeg ? colors.green : colors.error;

  return (
    <View style={[styles.vegBadge, { borderColor: color }]}>
      <View style={[styles.vegDot, { backgroundColor: color }]} />
    </View>
  );
}

// ── StatusPill ────────────────────────────────────────────
export function StatusPill({ status }) {
  const { isDark, colors } = useTheme();

  const map = {
    placed:           { bg: isDark ? colors.saffronPale : '#DCFCE7', color: isDark ? colors.saffronLight : colors.saffronDeep, label: 'Placed',      icon: 'receipt-outline' },
    confirmed:        { bg: isDark ? colors.saffronPale : '#DCFCE7', color: isDark ? colors.saffronLight : colors.saffronDeep, label: 'Confirmed',   icon: 'checkmark-circle-outline' },
    preparing:        { bg: isDark ? colors.saffronPale : '#DCFCE7', color: isDark ? colors.saffronLight : colors.saffronDeep, label: 'Preparing',   icon: 'flame-outline' },
    out_for_delivery: { bg: isDark ? colors.saffronPale : '#BBF7D0', color: isDark ? colors.saffron : colors.saffronDeep, label: 'On the way',  icon: 'bicycle-outline' },
    delivered:        { bg: isDark ? colors.successPale : '#D1FAE5', color: isDark ? colors.success : '#065F46', label: 'Delivered',    icon: 'checkmark-done-outline' },
    cancelled:        { bg: isDark ? colors.errorPale : '#FEE2E2', color: isDark ? colors.error : '#DC2626', label: 'Cancelled',   icon: 'close-circle-outline' },
  };
  const { bg, color, label, icon } = map[status] || { bg: colors.creamDark, color: colors.textMuted, label: status, icon: 'help-circle-outline' };

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.borderLight }, style]} />;
}

// ── Re-exports ────────────────────────────────────────────
export { default as BannerCarousel } from './BannerCarousel';
export { default as ItemDetailModal } from './ItemDetailModal';
export { default as HeartButton } from './HeartButton';
export { default as StarRating } from './StarRating';

// ── SectionHeader ─────────────────────────────────────────
export function SectionHeader({ title, subtitle, right }) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  btnText: {
    ...FONTS.bold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  inputLabel: {
    ...FONTS.semibold,
    fontSize: 13,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 13,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
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
    ...SHADOW.small,
  },
  vegBadge: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
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
    fontSize: 20,
    ...FONTS.bold,
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
  },
});

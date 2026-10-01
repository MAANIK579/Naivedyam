// src/components/index.js — Shared UI components with Glassmorphic styling

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
  const { colors, isDark } = useTheme();

  const isGlass = variant === 'glass';
  const isOutline = variant === 'outline';

  const bg = variant === 'primary'  ? colors.saffron
           : variant === 'outline'  ? 'transparent'
           : variant === 'green'    ? colors.green
           : variant === 'danger'   ? colors.error
           : variant === 'glass'    ? (colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)'))
           : colors.brown;

  const borderColor = isGlass
    ? (colors.glass?.border || (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)'))
    : isOutline
    ? colors.saffron
    : 'transparent';

  const borderTopColor = isGlass
    ? (colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.35)' : '#FFFFFF'))
    : borderColor;

  const color = isGlass
    ? colors.text
    : isOutline
    ? colors.saffron
    : colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderTopColor,
          borderWidth: isOutline ? 1.5 : (isGlass ? 1 : 0),
          opacity: loading ? 0.7 : 1,
        },
        style
      ]}
      activeOpacity={0.8}
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
  const { colors, isDark } = useTheme();

  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label && <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>}
      <View style={[
        styles.inputWrap,
        {
          backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)'),
          borderColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
          borderTopColor: colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.22)' : '#FFFFFF'),
        }
      ]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
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
  const { colors, isDark } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated
        ? (colors.glass?.cardElevated || (isDark ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.95)'))
        : (colors.glass?.card || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.84)')),
      borderColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'),
      borderTopColor: colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.28)' : '#FFFFFF'),
    },
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ── VegBadge ──────────────────────────────────────────────
export function VegBadge({ isVeg }) {
  const { colors } = useTheme();
  const color = isVeg ? colors.green : colors.error;

  return (
    <View style={[styles.vegBadge, { borderColor: color, backgroundColor: 'rgba(0,0,0,0.3)' }]}>
      <View style={[styles.vegDot, { backgroundColor: color }]} />
    </View>
  );
}

// ── StatusPill ────────────────────────────────────────────
export function StatusPill({ status }) {
  const { isDark, colors } = useTheme();

  const map = {
    placed:           { bg: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)', border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)', color: colors.saffron, label: 'Placed',      icon: 'receipt-outline' },
    confirmed:        { bg: isDark ? 'rgba(245, 158, 11, 0.2)'  : 'rgba(245, 158, 11, 0.15)', border: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.3)', color: colors.saffron, label: 'Confirmed',   icon: 'checkmark-circle-outline' },
    preparing:        { bg: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.18)', border: isDark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.35)', color: colors.saffron, label: 'Preparing',   icon: 'flame-outline' },
    out_for_delivery: { bg: isDark ? 'rgba(34, 197, 94, 0.2)'   : 'rgba(34, 197, 94, 0.15)', border: isDark ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.3)', color: colors.green,   label: 'On the way',  icon: 'bicycle-outline' },
    delivered:        { bg: isDark ? 'rgba(34, 197, 94, 0.22)'  : 'rgba(34, 197, 94, 0.18)', border: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.35)', color: colors.green,   label: 'Delivered',    icon: 'checkmark-done-outline' },
    cancelled:        { bg: isDark ? 'rgba(239, 68, 68, 0.2)'   : 'rgba(239, 68, 68, 0.15)', border: isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.3)', color: colors.error,   label: 'Cancelled',   icon: 'close-circle-outline' },
  };
  const { bg, border, color, label, icon } = map[status] || {
    bg: colors.glass?.pill || 'rgba(255,255,255,0.08)',
    border: colors.glass?.border || 'rgba(255,255,255,0.12)',
    color: colors.textMuted,
    label: status,
    icon: 'help-circle-outline',
  };

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
      <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider({ style }) {
  const { colors, isDark } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }, style]} />;
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
    borderWidth: 1,
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
    borderWidth: 1.5,
    borderRadius: 4,
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
    paddingVertical: 4.5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    ...FONTS.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 19,
    ...FONTS.bold,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
  },
});

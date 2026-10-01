import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../theme';

export default function GlassCard({
  children,
  style,
  onPress,
  activeOpacity = 0.88,
  elevated = false,
  subtle = false,
  radius = RADIUS.lg,
  padding = SPACING.lg,
  glow = false,
  ...rest
}) {
  const { colors, isDark } = useTheme();

  const bg = elevated
    ? (colors.glass?.cardElevated || (isDark ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.95)'))
    : subtle
    ? (colors.glass?.cardSubtle || (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)'))
    : (colors.glass?.card || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.84)'));

  const borderColor = glow
    ? colors.saffron
    : (colors.glass?.border || (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'));

  const borderTopColor = glow
    ? colors.saffronLight
    : (colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.28)' : '#FFFFFF'));

  const glassStyle = {
    backgroundColor: bg,
    borderRadius: radius,
    borderWidth: 1,
    borderColor,
    borderTopColor,
    padding,
    shadowColor: glow ? colors.saffron : '#000000',
    shadowOffset: { width: 0, height: elevated ? 6 : 3 },
    shadowOpacity: glow ? 0.35 : (isDark ? 0.35 : 0.08),
    shadowRadius: elevated ? 16 : 8,
    elevation: elevated ? 5 : 2,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[glassStyle, style]}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[glassStyle, style]} {...rest}>
      {children}
    </View>
  );
}

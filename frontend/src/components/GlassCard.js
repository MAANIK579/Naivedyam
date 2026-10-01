import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING, SHADOW } from '../theme';

/**
 * Modern elevated Card component (clean, tactile, and high-contrast)
 */
export default function GlassCard({
  children,
  style,
  onPress,
  activeOpacity = 0.85,
  elevated = false,
  subtle = false,
  radius = RADIUS.lg,
  padding = SPACING.lg,
  ...rest
}) {
  const { colors } = useTheme();

  const bg = elevated ? colors.cardElevated : subtle ? colors.creamDark : colors.cardBg;

  const cardStyle = {
    backgroundColor: bg,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding,
    ...(elevated ? SHADOW.medium : SHADOW.small),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[cardStyle, style]}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}

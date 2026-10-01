import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * AmbientGlow renders soft radiant blurred light orbs behind glassmorphic surfaces.
 * Pass pointerEvents="none" so touches effortlessly pass through to interactive views.
 */
export default function AmbientGlow({
  topOrb = true,
  bottomOrb = true,
  orb1Color,
  orb2Color,
  style,
}) {
  const { colors, isDark } = useTheme();

  const color1 = orb1Color || colors.glass?.orb1 || (isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(34, 197, 94, 0.14)');
  const color2 = orb2Color || colors.glass?.orb2 || (isDark ? 'rgba(22, 163, 74, 0.16)' : 'rgba(245, 158, 11, 0.12)');

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.container, style]} pointerEvents="none">
      {topOrb && (
        <View
          style={[
            styles.orb,
            styles.topOrb,
            { backgroundColor: color1 },
          ]}
        />
      )}
      {bottomOrb && (
        <View
          style={[
            styles.orb,
            styles.bottomOrb,
            { backgroundColor: color2 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    zIndex: -1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  topOrb: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    top: -SCREEN_WIDTH * 0.2,
    right: -SCREEN_WIDTH * 0.15,
  },
  bottomOrb: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    top: 420,
    left: -SCREEN_WIDTH * 0.2,
  },
});

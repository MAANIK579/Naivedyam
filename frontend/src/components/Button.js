// src/components/Button.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS } from '../theme';

export default function Button({ title, onPress, loading, variant = 'primary', style, textStyle, icon }) {
  const { colors } = useTheme();

  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const bg = variant === 'primary'   ? colors.saffron
           : variant === 'secondary' ? colors.creamDark
           : variant === 'outline'   ? 'transparent'
           : variant === 'green'     ? colors.green
           : variant === 'danger'    ? colors.error
           : colors.saffron;

  const borderColor = isOutline ? colors.saffron : isSecondary ? colors.border : 'transparent';
  const color = isOutline ? colors.saffron : isSecondary ? colors.text : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: isOutline || isSecondary ? 1 : 0,
          opacity: loading ? 0.7 : 1,
        },
        style
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={18} color={color} />}
          <Text style={[styles.btnText, { color }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
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
});

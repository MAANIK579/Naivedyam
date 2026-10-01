// src/components/SearchBar.js — Glassmorphic SearchBar
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search dishes...', onSubmit, style }) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const bg = focused
    ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)')
    : (colors.glass?.card || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)'));

  const borderColor = focused
    ? colors.saffron
    : (colors.glass?.border || (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'));

  const borderTopColor = focused
    ? colors.saffronLight
    : (colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.25)' : '#FFFFFF'));

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: bg,
        borderColor,
        borderTopColor,
        shadowColor: focused ? colors.saffron : '#000000',
        shadowOpacity: focused ? 0.25 : (isDark ? 0.25 : 0.06),
      },
      style
    ]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={focused ? colors.saffron : colors.textLight}
        style={{ marginRight: 8 }}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!value && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          activeOpacity={0.7}
          style={styles.clearBtn}
        >
          <Ionicons name="close-circle" size={18} color={colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    ...FONTS.regular,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
});

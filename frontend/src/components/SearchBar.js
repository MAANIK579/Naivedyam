// src/components/SearchBar.js — Modern High-Contrast SearchBar
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search dishes...', onSubmit, style }) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.cardBg,
        borderColor: focused ? colors.saffron : colors.border,
      },
      style
    ]}>
      <Ionicons
        name="search"
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
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOW.small,
  },
  input: {
    flex: 1,
    fontSize: 14,
    ...FONTS.regular,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
});

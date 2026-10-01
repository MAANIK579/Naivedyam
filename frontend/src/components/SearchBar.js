// src/components/SearchBar.js — with theme support
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search dishes...', onSubmit, style }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.creamDark, borderColor: focused ? colors.saffron : colors.border },
      style
    ]}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
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
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOW.small,
  },
  input: {
    flex: 1,
    fontSize: 15,
    ...FONTS.regular,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
});

// src/components/AddressCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

const LABEL_ICONS = {
  Home: 'home-outline',
  Work: 'briefcase-outline',
  Other: 'location-outline',
};

export default function AddressCard({ address, onPress, selected }) {
  const { colors } = useTheme();
  const iconName = LABEL_ICONS[address.label] || 'location-outline';
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.header}>
        <View style={styles.labelBadge}>
          <Ionicons name={iconName} size={12} color={colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.labelText}>{address.label || 'Address'}</Text>
        </View>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.green} style={{ marginRight: 3 }} />
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <Text style={styles.fullAddress}>{address.full_address}</Text>
      {!!address.landmark && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
          <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
          <Text style={styles.landmark}>Near: {address.landmark}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.small,
  },
  cardSelected: {
    borderColor: colors.saffron,
    borderWidth: 2,
    backgroundColor: colors.saffronPale,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelText: {
    ...FONTS.semibold,
    fontSize: 11,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  defaultText: {
    ...FONTS.medium,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fullAddress: {
    ...FONTS.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  landmark: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});

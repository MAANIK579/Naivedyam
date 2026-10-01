// src/components/CouponBadge.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS } from '../theme';

export default function CouponBadge({ code, discount, onRemove }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.badge}>
      <Ionicons name="pricetag" size={14} color={colors.saffron} style={{ marginRight: 6 }} />
      <Text style={styles.text}>
        {code} · -₹{discount}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} activeOpacity={0.7} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={16} color={colors.saffron} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronPale,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  text: {
    ...FONTS.semibold,
    fontSize: 13,
    color: colors.saffron,
    letterSpacing: 0.3,
  },
  removeBtn: {
    marginLeft: 8,
    padding: 2,
  },
});

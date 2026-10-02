// src/components/VegBadge.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function VegBadge({ isVeg }) {
  const color = isVeg ? '#16A34A' : '#DC2626';

  return (
    <View style={[styles.vegBadge, { borderColor: color }]}>
      <View style={[styles.vegDot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  vegBadge: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

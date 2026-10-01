// src/components/OrderTimeline.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../theme';

const STEPS = [
  { key: 'placed',           label: 'Order Placed' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'preparing',        label: 'Preparing' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'delivered',        label: 'Delivered' },
];

const STATUS_INDEX = {
  placed:           0,
  confirmed:        1,
  preparing:        2,
  out_for_delivery: 3,
  delivered:        4,
};

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function OrderTimeline({ status, statusHistory }) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const currentIdx = STATUS_INDEX[status] ?? -1;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const pending = idx > currentIdx;

        const histEntry = statusHistory
          ? statusHistory.find(h => h.status === step.key)
          : null;

        return (
          <View key={step.key} style={styles.step}>
            {/* Left: circle + connecting line */}
            <View style={styles.indicatorCol}>
              {active ? (
                <Animated.View
                  style={[styles.circle, styles.activeCircle, { transform: [{ scale: pulseAnim }] }]}
                />
              ) : done ? (
                <View style={[styles.circle, styles.doneCircle]}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              ) : (
                <View style={[styles.circle, styles.pendingCircle]} />
              )}
              {idx < STEPS.length - 1 && (
                <View style={[styles.line, done && styles.lineDone]} />
              )}
            </View>

            {/* Right: label + timestamp */}
            <View style={styles.labelCol}>
              <Text
                style={[
                  styles.label,
                  done    && styles.labelDone,
                  active  && styles.labelActive,
                  pending && styles.labelPending,
                ]}
              >
                {step.label}
              </Text>
              {histEntry && (
                <Text style={styles.time}>{formatTime(histEntry.timestamp)}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 34,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircle: {
    backgroundColor: colors.saffron,
  },
  activeCircle: {
    backgroundColor: colors.saffronLight,
    borderWidth: 2.5,
    borderColor: colors.saffron,
  },
  pendingCircle: {
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkText: {
    color: colors.white,
    fontSize: 13,
    ...FONTS.bold,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  lineDone: {
    backgroundColor: colors.saffron,
  },
  labelCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    ...FONTS.regular,
  },
  labelDone: {
    color: colors.text,
    ...FONTS.semibold,
  },
  labelActive: {
    color: colors.saffron,
    ...FONTS.bold,
  },
  labelPending: {
    color: colors.textLight,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
